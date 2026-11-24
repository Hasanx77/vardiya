import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";
import {
  AZAMI_DENEME,
  KOD_OMRU_DK,
  type KodAmaci,
  kodDurumu,
  kodOzetle,
  ozetEsitMi,
  type KodDurumu,
} from "./eposta-kodu";

/**
 * E-posta kodu — **veritabanı katmanı**.
 *
 * Tablo şemada değil; ilk kullanımda ham SQL ile kurulur (Visit / Message /
 * EmployeeLink / KvkkOnay / IzinTalebi / Okundu ile aynı yol). Böylece canlıda
 * `prisma migrate` beklemeden devreye girer.
 *
 * Saklananlar: e-posta, amaç, kod **özeti** (HMAC), son kullanma (ISO metin),
 * deneme sayısı, tüketildi bayrağı, günlük tuzlu IP özeti.
 * Saklanmayanlar: kodun kendisi, ham IP, cihaz bilgisi.
 */

const TABLO = "EpostaKodu";

let tabloHazir = false;

async function tabloyuHazirla(): Promise<void> {
  if (tabloHazir) return;
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "${TABLO}" (
       "id" TEXT NOT NULL PRIMARY KEY,
       "email" TEXT NOT NULL,
       "amac" TEXT NOT NULL,
       "kodHash" TEXT NOT NULL,
       "sonKullanma" TEXT NOT NULL,
       "deneme" INTEGER NOT NULL DEFAULT 0,
       "tuketildi" INTEGER NOT NULL DEFAULT 0,
       "createdAt" TEXT NOT NULL,
       "userId" TEXT,
       "ipHash" TEXT
     )`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "${TABLO}_hedef_idx"
       ON "${TABLO}" ("email", "amac", "createdAt")`,
  );
  tabloHazir = true;
}

export type KodSatiri = {
  id: string;
  email: string;
  amac: string;
  kodHash: string;
  sonKullanma: string;
  deneme: number;
  tuketildi: number;
  createdAt: string;
  userId: string | null;
};

/** Yeni kod yazar; aynı e-posta + amaç için eski kullanılmamış kodları geçersiz kılar. */
export async function kodKaydet(girdi: {
  email: string;
  amac: KodAmaci;
  kodHash: string;
  userId?: string | null;
  ipHash?: string | null;
}): Promise<string> {
  await tabloyuHazirla();
  const email = girdi.email.trim().toLowerCase();
  const simdi = new Date();

  // Önceki kodları geçersiz kıl: aynı anda tek kod geçerli olsun.
  await prisma.$executeRawUnsafe(
    `UPDATE "${TABLO}" SET "tuketildi" = 1
      WHERE "email" = ? AND "amac" = ? AND "tuketildi" = 0`,
    email,
    girdi.amac,
  );

  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "${TABLO}"
       ("id", "email", "amac", "kodHash", "sonKullanma", "deneme", "tuketildi", "createdAt", "userId", "ipHash")
     VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`,
    id,
    email,
    girdi.amac,
    girdi.kodHash,
    new Date(simdi.getTime() + KOD_OMRU_DK * 60_000).toISOString(),
    simdi.toISOString(),
    girdi.userId ?? null,
    girdi.ipHash ?? null,
  );
  return id;
}

/** E-posta + amaç için en son kod satırı. */
export async function sonKod(email: string, amac: KodAmaci): Promise<KodSatiri | null> {
  try {
    await tabloyuHazirla();
    const satirlar = await prisma.$queryRawUnsafe<KodSatiri[]>(
      `SELECT * FROM "${TABLO}"
        WHERE "email" = ? AND "amac" = ?
        ORDER BY "createdAt" DESC LIMIT 1`,
      email.trim().toLowerCase(),
      amac,
    );
    return satirlar[0] ?? null;
  } catch (e) {
    console.error("eposta-kodu:sonKod", e);
    return null;
  }
}

/** Son gönderim zamanı (yeniden gönderme aralığı için). */
export async function sonGonderimZamani(
  email: string,
  amac: KodAmaci,
): Promise<Date | null> {
  const satir = await sonKod(email, amac);
  if (!satir) return null;
  const t = new Date(satir.createdAt);
  return Number.isNaN(t.getTime()) ? null : t;
}

/** Son bir saatte bu e-posta için gönderilen kod sayısı. */
export async function saatlikGonderimSayisi(email: string): Promise<number> {
  try {
    await tabloyuHazirla();
    const esik = new Date(Date.now() - 60 * 60_000).toISOString();
    const satirlar = await prisma.$queryRawUnsafe<{ adet: number }[]>(
      `SELECT COUNT(*) AS adet FROM "${TABLO}"
        WHERE "email" = ? AND "createdAt" >= ?`,
      email.trim().toLowerCase(),
      esik,
    );
    return Number(satirlar[0]?.adet ?? 0);
  } catch {
    return 0;
  }
}

async function denemeArtir(id: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `UPDATE "${TABLO}" SET "deneme" = "deneme" + 1 WHERE "id" = ?`,
    id,
  );
}

async function koduTuket(id: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `UPDATE "${TABLO}" SET "tuketildi" = 1 WHERE "id" = ?`,
    id,
  );
}

/** Kodun geçerlilik özeti (ekranlarda "kalan süre" göstermek için). */
export async function kodDurumOzeti(
  email: string,
  amac: KodAmaci,
): Promise<{ var: boolean; durum: KodDurumu | null; kalanDeneme: number }> {
  const satir = await sonKod(email, amac);
  if (!satir) return { var: false, durum: null, kalanDeneme: AZAMI_DENEME };
  return {
    var: true,
    durum: kodDurumu(satir),
    kalanDeneme: Math.max(0, AZAMI_DENEME - satir.deneme),
  };
}

export type KodDogrulamaSonucu =
  | { ok: true; satir: KodSatiri }
  | { ok: false; durum: KodDurumu; kalanDeneme: number };

/**
 * Kodu doğrular. Yanlış denemede sayacı artırır, doğruysa kodu tüketir.
 *
 * Dönüş: `ok:false` ise `durum` kullanıcıya gösterilecek nedeni taşır.
 */
export async function koduDogrula(girdi: {
  email: string;
  amac: KodAmaci;
  kod: string;
}): Promise<KodDogrulamaSonucu> {
  await tabloyuHazirla();
  const email = girdi.email.trim().toLowerCase();
  const satir = await sonKod(email, girdi.amac);
  if (!satir) return { ok: false, durum: "suresi-doldu", kalanDeneme: 0 };

  const durum = kodDurumu(satir);
  if (durum !== "gecerli") {
    return {
      ok: false,
      durum,
      kalanDeneme: Math.max(0, AZAMI_DENEME - satir.deneme),
    };
  }

  const beklenen = kodOzetle(girdi.kod, email, girdi.amac);
  if (!ozetEsitMi(satir.kodHash, beklenen)) {
    await denemeArtir(satir.id);
    const kalan = Math.max(0, AZAMI_DENEME - (satir.deneme + 1));
    return {
      ok: false,
      durum: kalan === 0 ? "deneme-limiti" : "gecerli",
      kalanDeneme: kalan,
    };
  }

  await koduTuket(satir.id);
  return { ok: true, satir };
}

/** 2 günden eski kod satırlarını siler (gizlilik/yer tasarrufu). */
export async function eskiKodlariSil(): Promise<void> {
  try {
    await tabloyuHazirla();
    const esik = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
    await prisma.$executeRawUnsafe(
      `DELETE FROM "${TABLO}" WHERE "createdAt" < ?`,
      esik,
    );
  } catch {
    /* fail-open */
  }
}
