/**
 * Hız sınırı — **paylaşımlı** sayaç (veritabanında).
 *
 * Neden bellek içi değil: süreç yeniden başlayınca (veya birden fazla örnek
 * çalışınca) bellek içi sayaç sıfırlanır. Personel programı ve `.ics` takvimi
 * gibi girişsiz uçlar jeton denemesi ve ucuz DoS için hedef olabilir.
 *
 * Tablo ham SQL ile lazy kurulur (canlıda migration gerekmez).
 *
 * Politika: veritabanı hata verirse **fail-open** — personel programı bir
 * altyapı arızası yüzünden kilitlenmesin. Hata günlüğe yazılır.
 */
import { prisma } from "./prisma";

const TABLO = "HizSiniri";
const TEMIZLIK_ARALIGI_MS = 24 * 60 * 60 * 1000;

let tabloHazir = false;
let sonTemizlik = 0;

export type PencereKaydi = { sayi: number; pencereBaslangic: number };

export type PencereSonucu = {
  izinli: boolean;
  /** Pencere içindeki yeni toplam istek sayısı (reddedilirse artmaz). */
  sayi: number;
  pencereBaslangic: number;
  /** Bu pencerede kalan hak. */
  kalan: number;
};

/**
 * Saf sayaç hesabı — veritabanından bağımsız, test edilebilir.
 *
 * @param kayit     önceki kayıt (yoksa null)
 * @param simdi     şimdiki zaman (ms)
 * @param azami     pencere başına azami istek
 * @param pencereMs pencere uzunluğu (ms)
 */
export function pencereDurumu(
  kayit: PencereKaydi | null,
  simdi: number,
  azami: number,
  pencereMs: number,
): PencereSonucu {
  const gecerli =
    !!kayit &&
    Number.isFinite(kayit.pencereBaslangic) &&
    simdi - kayit.pencereBaslangic < pencereMs &&
    simdi - kayit.pencereBaslangic >= 0;

  const pencereBaslangic = gecerli ? kayit!.pencereBaslangic : simdi;
  const onceki = gecerli ? Math.max(0, Math.floor(kayit!.sayi)) : 0;
  const izinli = onceki < azami;
  const sayi = izinli ? onceki + 1 : onceki;

  return {
    izinli,
    sayi,
    pencereBaslangic,
    kalan: Math.max(0, azami - sayi),
  };
}

async function tabloKur(): Promise<void> {
  if (tabloHazir) return;
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "HizSiniri" (
       "anahtar" TEXT NOT NULL PRIMARY KEY,
       "sayi" INTEGER NOT NULL DEFAULT 0,
       "pencereBaslangic" TEXT NOT NULL
     )`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "HizSiniri_pencere_idx" ON "HizSiniri" ("pencereBaslangic")`,
  );
  tabloHazir = true;
}

/**
 * Tek bir anahtar için isteği sayar.
 * @example await hizDenetle(`ekip:ip:${ip}`, 60, 60_000)
 */
export async function hizDenetle(
  anahtar: string,
  azami: number,
  pencereMs: number,
): Promise<{ izinli: boolean }> {
  try {
    await tabloKur();

    const satirlar = await prisma.$queryRawUnsafe<
      { sayi: number | bigint; pencereBaslangic: string }[]
    >(
      `SELECT "sayi", "pencereBaslangic" FROM "HizSiniri" WHERE "anahtar" = ? LIMIT 1`,
      anahtar,
    );

    const satir = satirlar?.[0];
    const kayit: PencereKaydi | null = satir
      ? { sayi: Number(satir.sayi), pencereBaslangic: Date.parse(satir.pencereBaslangic) }
      : null;

    const sonuc = pencereDurumu(kayit, Date.now(), azami, pencereMs);

    if (sonuc.izinli) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "HizSiniri" ("anahtar", "sayi", "pencereBaslangic")
         VALUES (?, ?, ?)
         ON CONFLICT("anahtar") DO UPDATE SET
           "sayi" = excluded."sayi",
           "pencereBaslangic" = excluded."pencereBaslangic"`,
        anahtar,
        sonuc.sayi,
        new Date(sonuc.pencereBaslangic).toISOString(),
      );
    }

    // Günde bir kez eski pencereleri temizle (tablo şişmesin).
    if (Date.now() - sonTemizlik > TEMIZLIK_ARALIGI_MS) {
      sonTemizlik = Date.now();
      const sinir = new Date(Date.now() - TEMIZLIK_ARALIGI_MS).toISOString();
      await prisma.$executeRawUnsafe(
        `DELETE FROM "HizSiniri" WHERE "pencereBaslangic" < ?`,
        sinir,
      );
    }

    return { izinli: sonuc.izinli };
  } catch (e) {
    // Fail-open: altyapı arızası personelin programını kilitlemesin.
    console.error(
      "hız sınırı okunamadı:",
      e instanceof Error ? e.message : String(e),
    );
    return { izinli: true };
  }
}
