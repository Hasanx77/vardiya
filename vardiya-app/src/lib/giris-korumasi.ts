/**
 * Kalıcı giriş denemesi koruması (brute-force / credential stuffing).
 *
 * Önceki sürüm **bellek içi** bir Map kullanıyordu: sunucu yeniden başlayınca
 * sayaç sıfırlanıyor, süreç başına ayrı sayılıyordu. Saldırgan için bu, "10
 * deneme → bekle → 10 deneme" demekti. Bu sürüm sayacı **veritabanında** tutar
 * ve deneme arttıkça kilidi uzatır (kademeli gecikme).
 *
 * Politika (15 dakikalık pencere, eşik 5):
 *   1-4 hata  → serbest (yazım hatası normaldir)
 *   5. hata   → 1 dakika kilit
 *   6.        → 5 dakika
 *   7.        → 15 dakika
 *   8.        → 30 dakika
 *   9+        → 60 dakika
 * Kilit bitince ve 15 dakika boyunca yeni hata gelmezse sayaç sıfırlanır.
 *
 * Tablo ham SQL ile kurulur (canlıda migration gerekmez). Zamanlar **ISO metin**
 * olarak saklanır: Prisma'nın SQLite sürücüsü büyük tamsayıları INT32 sanıp
 * "value does not fit in an INT column" hatası veriyordu; ISO metinler hem
 * sıralanabilir hem taşma yapmaz.
 *
 * Veritabanı hatasında **fail-open** davranır: koruma yüzünden kimse giremez olmasın.
 */
import { prisma } from "./prisma";

const PENCERE_MS = 15 * 60 * 1000;
export const ESIK = 5;
const KILITLER_MS = [0, 0, 0, 0, 0, 60_000, 5 * 60_000, 15 * 60_000, 30 * 60_000, 60 * 60_000];
const KAYIT_OMRU_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Anahtar + eşik. Eşikler bilinçli olarak farklı:
 *   - IP + e-posta → 5  (tek hesaba tek kaynaktan saldırı)
 *   - hesap        → 8  (dağıtık IP'lerden tek hesaba saldırı)
 *   - yalnız IP    → 20 (tek kaynaktan çok hesap deneme; ofis/NAT paylaşımını
 *                        yanlışlıkla kilitlememek için yüksek)
 */
export type KorumaAnahtari = { anahtar: string; esik?: number };

function normalize(girdi: string | KorumaAnahtari): KorumaAnahtari {
  return typeof girdi === "string" ? { anahtar: girdi } : girdi;
}

let tabloHazir = false;
let sonTemizlik = 0;

async function tabloKur(): Promise<void> {
  if (tabloHazir) return;
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "GirisDenemesi" (
       "anahtar" TEXT NOT NULL PRIMARY KEY,
       "sayi" INTEGER NOT NULL DEFAULT 0,
       "ilk" TEXT NOT NULL,
       "son" TEXT NOT NULL,
       "kilitBitis" TEXT NOT NULL DEFAULT ''
     )`,
  );
  tabloHazir = true;
}

/** `sayi`. hatadan sonra uygulanacak kilit süresi (ms). Saf fonksiyon — test edilebilir. */
export function kilitSuresi(sayi: number, esik = ESIK): number {
  if (sayi < esik) return 0;
  const indeks = Math.min(sayi - esik + ESIK, KILITLER_MS.length - 1);
  return KILITLER_MS[indeks] ?? 60 * 60 * 1000;
}

type Satir = { sayi: bigint | number; ilk: string; son: string; kilitBitis: string };

async function satirOku(anahtar: string): Promise<Satir | null> {
  const satirlar = await prisma.$queryRaw<Satir[]>`
    SELECT "sayi", "ilk", "son", "kilitBitis" FROM "GirisDenemesi" WHERE "anahtar" = ${anahtar} LIMIT 1
  `;
  return satirlar[0] ?? null;
}

export type DenetimSonucu = { izinli: boolean; bekleSaniye: number };

/**
 * Verilen anahtarlardan **biri** kilitliyse isteği reddeder.
 * Anahtarlar birlikte değerlendirilir: IP+e-posta, hesap, IP.
 */
export async function girisDenetle(
  girdiler: (string | KorumaAnahtari)[],
): Promise<DenetimSonucu> {
  const anahtarlar = girdiler.map(normalize);
  const simdi = Date.now();
  try {
    await tabloKur();
    let enUzun = 0;
    for (const { anahtar } of anahtarlar) {
      const satir = await satirOku(anahtar);
      if (!satir?.kilitBitis) continue;
      const bitis = Date.parse(satir.kilitBitis);
      if (Number.isFinite(bitis) && bitis > simdi) {
        enUzun = Math.max(enUzun, Math.ceil((bitis - simdi) / 1000));
      }
    }
    return { izinli: enUzun === 0, bekleSaniye: enUzun };
  } catch (e) {
    console.error("giriş koruması okunamadı:", e);
    return { izinli: true, bekleSaniye: 0 };
  }
}

/** Başarısız denemeyi sayar ve gerekirse kilidi uzatır. */
export async function girisBasarisiz(
  girdiler: (string | KorumaAnahtari)[],
): Promise<void> {
  const anahtarlar = girdiler.map(normalize);
  const simdi = Date.now();
  const iso = new Date(simdi).toISOString();
  try {
    await tabloKur();
    for (const { anahtar, esik } of anahtarlar) {
      const satir = await satirOku(anahtar);
      let sayi = 1;
      let ilk = iso;

      if (satir) {
        const oncekiSayi = Number(satir.sayi);
        const oncekiSon = Date.parse(satir.son);
        const pencereGecti = Number.isFinite(oncekiSon) && simdi - oncekiSon > PENCERE_MS;
        // Pencere geçtiyse ve eşiğe ulaşılmamışsa sayaç yeniden başlar;
        // eşik aşıldıysa (ısrarcı saldırgan) sayaç korunur → kilit daha da uzar.
        if (pencereGecti && oncekiSayi < (esik ?? ESIK)) {
          sayi = 1;
          ilk = iso;
        } else {
          sayi = oncekiSayi + 1;
          ilk = satir.ilk || iso;
        }
      }

      const kilit = kilitSuresi(sayi, esik ?? ESIK);
      const kilitBitis = kilit > 0 ? new Date(simdi + kilit).toISOString() : "";

      await prisma.$executeRaw`
        INSERT INTO "GirisDenemesi" ("anahtar", "sayi", "ilk", "son", "kilitBitis")
        VALUES (${anahtar}, ${sayi}, ${ilk}, ${iso}, ${kilitBitis})
        ON CONFLICT("anahtar") DO UPDATE SET
          "sayi" = excluded."sayi",
          "ilk" = excluded."ilk",
          "son" = excluded."son",
          "kilitBitis" = excluded."kilitBitis"
      `;
    }

    // Günde bir kez eski kayıtları temizle (tablo şişmesin).
    if (simdi - sonTemizlik > 24 * 60 * 60 * 1000) {
      sonTemizlik = simdi;
      const sinir = new Date(simdi - KAYIT_OMRU_MS).toISOString();
      await prisma.$executeRaw`DELETE FROM "GirisDenemesi" WHERE "son" < ${sinir}`;
    }
  } catch (e) {
    console.error("giriş koruması yazılamadı:", e);
  }
}

/** Başarılı girişte sayaçları sıfırla. */
export async function girisTemizle(
  girdiler: (string | KorumaAnahtari)[],
): Promise<void> {
  const anahtarlar = girdiler.map(normalize);
  try {
    await tabloKur();
    for (const { anahtar } of anahtarlar) {
      await prisma.$executeRaw`DELETE FROM "GirisDenemesi" WHERE "anahtar" = ${anahtar}`;
    }
  } catch (e) {
    console.error("giriş koruması temizlenemedi:", e);
  }
}

/** Bekleme süresini insan diline çevirir ("2 dk"). */
export function beklemeMetni(saniye: number): string {
  if (saniye <= 0) return "";
  if (saniye < 60) return `${saniye} saniye`;
  const dakika = Math.ceil(saniye / 60);
  if (dakika < 60) return `${dakika} dakika`;
  return `${Math.ceil(dakika / 60)} saat`;
}
