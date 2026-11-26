import { prisma } from "./prisma";
import { VARSAYILAN_DIL, dilGecerliMi, type Dil } from "./dil";

/**
 * Kullanıcı ayarları — **ham SQL** tablo (canlıda migration gerekmez).
 *
 * Neden ayrı tablo: ayarlar kullanıcı başına anahtar/değer çiftidir; şemaya
 * her yeni tercih için kolon eklemek yerine tek tablo yeter.
 *
 * Gizlilik: burada yalnızca tercih bayrakları ve tema tutulur; kişisel veri
 * kopyası yoktur.
 */

const TABLO = "Ayar";

export type Tema = "sistem" | "acik" | "koyu";

export type Ayarlar = {
  /** Plan yayınlandığında e-posta gelsin mi? */
  bildirimYayin: boolean;
  /** Personelden izin/mazeret talebi gelince e-posta gelsin mi? */
  bildirimIzin: boolean;
  /** Haftalık özet e-postası (pazartesi). */
  bildirimOzet: boolean;
  tema: Tema;
  /** Arayüz dili. */
  dil: Dil;
};

export const VARSAYILAN_AYARLAR: Ayarlar = {
  bildirimYayin: true,
  bildirimIzin: true,
  bildirimOzet: false,
  tema: "sistem",
  dil: VARSAYILAN_DIL,
};

export const TEMA_SECENEKLERI: readonly Tema[] = ["sistem", "acik", "koyu"];

let tabloHazir = false;

async function tabloyuHazirla(): Promise<void> {
  if (tabloHazir) return;
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "${TABLO}" (
       "userId" TEXT NOT NULL,
       "anahtar" TEXT NOT NULL,
       "deger" TEXT NOT NULL,
       PRIMARY KEY ("userId", "anahtar")
     )`,
  );
  tabloHazir = true;
}

/** Ham kayıtları (anahtar → değer) tipe çevirir. Saf — test edilebilir. */
export function ayarNormalize(ham: Record<string, string> | null | undefined): Ayarlar {
  const kayit = ham ?? {};
  const bayrak = (anahtar: keyof Ayarlar, varsayilan: boolean) => {
    const v = kayit[anahtar];
    if (v === "1") return true;
    if (v === "0") return false;
    return varsayilan;
  };
  const tema = kayit.tema;
  return {
    bildirimYayin: bayrak("bildirimYayin", VARSAYILAN_AYARLAR.bildirimYayin),
    bildirimIzin: bayrak("bildirimIzin", VARSAYILAN_AYARLAR.bildirimIzin),
    bildirimOzet: bayrak("bildirimOzet", VARSAYILAN_AYARLAR.bildirimOzet),
    tema: TEMA_SECENEKLERI.includes(tema as Tema) ? (tema as Tema) : VARSAYILAN_AYARLAR.tema,
    dil: dilGecerliMi(String(kayit.dil ?? "")) ? (kayit.dil as Dil) : VARSAYILAN_DIL,
  };
}

export async function ayarlariAl(userId: string): Promise<Ayarlar> {
  try {
    await tabloyuHazirla();
    const satirlar = await prisma.$queryRawUnsafe<{ anahtar: string; deger: string }[]>(
      `SELECT "anahtar", "deger" FROM "${TABLO}" WHERE "userId" = ?`,
      userId,
    );
    const ham: Record<string, string> = {};
    for (const s of satirlar) ham[s.anahtar] = s.deger;
    return ayarNormalize(ham);
  } catch (e) {
    console.error("ayarlar: okunamadı:", e instanceof Error ? e.message : e);
    return { ...VARSAYILAN_AYARLAR };
  }
}

export async function ayarYaz(userId: string, anahtar: keyof Ayarlar, deger: string): Promise<void> {
  await tabloyuHazirla();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "${TABLO}" ("userId", "anahtar", "deger") VALUES (?, ?, ?)
       ON CONFLICT("userId","anahtar") DO UPDATE SET "deger" = excluded."deger"`,
    userId,
    anahtar,
    deger,
  );
}

export async function ayarlariYaz(userId: string, kismi: Partial<Ayarlar>): Promise<Ayarlar> {
  if (typeof kismi.bildirimYayin === "boolean") {
    await ayarYaz(userId, "bildirimYayin", kismi.bildirimYayin ? "1" : "0");
  }
  if (typeof kismi.bildirimIzin === "boolean") {
    await ayarYaz(userId, "bildirimIzin", kismi.bildirimIzin ? "1" : "0");
  }
  if (typeof kismi.bildirimOzet === "boolean") {
    await ayarYaz(userId, "bildirimOzet", kismi.bildirimOzet ? "1" : "0");
  }
  if (kismi.tema && TEMA_SECENEKLERI.includes(kismi.tema)) {
    await ayarYaz(userId, "tema", kismi.tema);
  }
  if (kismi.dil && dilGecerliMi(kismi.dil)) {
    await ayarYaz(userId, "dil", kismi.dil);
  }
  return ayarlariAl(userId);
}

/** Belirli bir bildirim açık mı? (gönderim noktaları için kısa yol) */
export async function bildirimAcikMi(
  userId: string,
  tur: "bildirimYayin" | "bildirimIzin" | "bildirimOzet",
): Promise<boolean> {
  const a = await ayarlariAl(userId);
  return a[tur];
}
