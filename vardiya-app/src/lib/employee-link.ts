import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";

/**
 * Personele verilen girişsiz bağlantının **iptal edilebilir** olması için
 * imzalı belirteç (token) üretir.
 *
 * Neden ayrı tablo: yayındaki SQLite şemasına yeni kolon eklemek migration
 * gerektiriyor. Bağlantı sürümü yalnızca üç alanlık bir tabloda tutulur ve
 * tablo ilk kullanımda ham SQL ile oluşturulur (Visit/Message tablolarındaki
 * kanıtlanmış yöntem).
 *
 * Çalışma biçimi:
 *   token = "<personelId>.<HMAC-SHA256(AUTH_SECRET, 'ekip:<id>:<sürüm>')>"
 *   - Sürüm 0 → ilk link (satır yoksa da geçerli; GET sırasında yazma yok).
 *   - "Yenile"  → sürüm +1 (eski link anında ölür).
 *   - "Kapat"   → sürüm -1 (hiçbir link geçerli değil).
 */

const TABLO = "EmployeeLink";
let tabloHazir = false;

async function tabloyuHazirla() {
  if (tabloHazir) return;
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "EmployeeLink" (
       "employeeId" TEXT NOT NULL PRIMARY KEY,
       "version" INTEGER NOT NULL DEFAULT 0,
       "updatedAt" TEXT NOT NULL
     )`
  );
  tabloHazir = true;
}

function anahtar(): string {
  const s = (process.env.AUTH_SECRET ?? "").trim();
  // Geliştirme ortamında AUTH_SECRET yoksa tahmin edilemez olmayan ama
  // tutarlı bir anahtar kullanılır; canlıda gerçek değer okunur.
  return s.length >= 16 ? s : "vardiya-gelistirme-baglanti-anahtari";
}

function imza(employeeId: string, version: number): string {
  return createHmac("sha256", anahtar())
    .update(`ekip:${employeeId}:${version}`)
    .digest("base64url")
    .slice(0, 24);
}

export function tokenUret(employeeId: string, version: number): string {
  return `${employeeId}.${imza(employeeId, version)}`;
}

export type LinkDurumu = {
  version: number;
  aktif: boolean;
  token: string | null;
  /** İstemcinin başına origin ekleyeceği yol */
  yol: string | null;
};

export async function linkDurumu(employeeId: string): Promise<LinkDurumu> {
  await tabloyuHazirla();
  const satirlar = await prisma.$queryRawUnsafe<{ version: number }[]>(
    `SELECT "version" FROM "${TABLO}" WHERE "employeeId" = ?`,
    employeeId
  );
  const version = Number(satirlar[0]?.version ?? 0);
  const aktif = version >= 0;
  const token = aktif ? tokenUret(employeeId, version) : null;
  return { version, aktif, token, yol: token ? `/ekip/${token}` : null };
}

async function surumYaz(employeeId: string, version: number) {
  await tabloyuHazirla();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "${TABLO}" ("employeeId", "version", "updatedAt")
     VALUES (?, ?, ?)
     ON CONFLICT("employeeId") DO UPDATE SET
       "version" = excluded."version",
       "updatedAt" = excluded."updatedAt"`,
    employeeId,
    version,
    new Date().toISOString()
  );
}

/** Linki yeniler: eski bağlantı geçersiz olur, yenisi döner. */
export async function linkYenile(employeeId: string): Promise<string> {
  const { version } = await linkDurumu(employeeId);
  const yeni = Math.max(0, version) + 1;
  await surumYaz(employeeId, yeni);
  return tokenUret(employeeId, yeni);
}

/** Linki kapatır: personel elindeki bağlantıyla artık açamaz. */
export async function linkKapat(employeeId: string): Promise<void> {
  await surumYaz(employeeId, -1);
}

/** Kapalı linki yeniden açar (yeni sürümle; eski link geri gelmez). */
export async function linkAc(employeeId: string): Promise<string> {
  const { version } = await linkDurumu(employeeId);
  const yeni = Math.max(0, version) + 1;
  await surumYaz(employeeId, yeni);
  return tokenUret(employeeId, yeni);
}

/**
 * Token'ı doğrular ve personel kimliğini döner.
 * Geçersiz / kapatılmış / eski sürüm → null.
 */
export async function tokenCoz(token: string): Promise<string | null> {
  const ham = String(token ?? "").trim();
  const nokta = ham.lastIndexOf(".");
  if (nokta < 1 || nokta > 80) return null;

  const employeeId = ham.slice(0, nokta);
  const gelen = ham.slice(nokta + 1);
  if (!employeeId || !/^[A-Za-z0-9_-]+$/.test(employeeId)) return null;
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(gelen)) return null;

  const durum = await linkDurumu(employeeId);
  if (!durum.aktif) return null;

  const beklenen = imza(employeeId, durum.version);
  if (gelen.length !== beklenen.length) return null;

  const a = Buffer.from(gelen);
  const b = Buffer.from(beklenen);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? employeeId : null;
}
