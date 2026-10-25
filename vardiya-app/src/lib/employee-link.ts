import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";
import { authSecret } from "./sir";

/**
 * Personele verilen girişsiz bağlantının **iptal edilebilir** ve **süreli**
 * olması için imzalı belirteç (token) üretir.
 *
 * Neden ayrı tablo: yayındaki SQLite şemasına yeni kolon eklemek migration
 * gerektiriyor. Bağlantı sürümü yalnızca üç alanlık bir tabloda tutulur ve
 * tablo ilk kullanımda ham SQL ile oluşturulur (Visit/Message tablolarındaki
 * kanıtlanmış yöntem).
 *
 * Çalışma biçimi:
 *   yeni: "<personelId>.<sonKullanmaMs>.<HMAC-SHA256(AUTH_SECRET, 'ekip:<id>:<sürüm>:<sonKullanma>')>"
 *   eski: "<personelId>.<HMAC-SHA256(AUTH_SECRET, 'ekip:<id>:<sürüm>')>"  (süresiz, uyumluluk)
 *
 *   - Sürüm 0 → ilk link (satır yoksa da geçerli; GET sırasında yazma yok).
 *   - "Yenile"  → sürüm +1 (eski link anında ölür).
 *   - "Kapat"   → sürüm -1 (hiçbir link geçerli değil).
 */

const TABLO = "EmployeeLink";
let tabloHazir = false;

/** Yeni üretilen bağlantıların ömrü (gün). */
export const LINK_GECERLILIK_GUN = 90;
const GUN_MS = 24 * 60 * 60 * 1000;

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

/**
 * Son kullanma zamanı: "şimdi + 90 gün", **gün sınırına yuvarlanmış**.
 *
 * Neden yuvarlanıyor: panel her açıldığında yeni bir jeton üretiliyor. Gün
 * sınırına yuvarlanmazsa link her yenilemede değişir (kullanıcı "link mi
 * değişti?" diye sorar). Aynı gün içinde jeton sabit kalır; yine de her jeton
 * 90 gün geçerlidir ve sürüm artırılınca hepsi birden ölür.
 */
function sonKullanmaHesapla(): number {
  return Math.ceil((Date.now() + LINK_GECERLILIK_GUN * GUN_MS) / GUN_MS) * GUN_MS;
}

/** Eski (süresiz) biçim için imza. */
function imzaEski(employeeId: string, version: number): string {
  return createHmac("sha256", authSecret())
    .update(`ekip:${employeeId}:${version}`)
    .digest("base64url")
    .slice(0, 24);
}

/** Yeni (süreli) biçim için imza. */
function imza(employeeId: string, version: number, sonKullanma: number): string {
  return createHmac("sha256", authSecret())
    .update(`ekip:${employeeId}:${version}:${sonKullanma}`)
    .digest("base64url")
    .slice(0, 24);
}

export function tokenUret(
  employeeId: string,
  version: number,
  sonKullanma: number = sonKullanmaHesapla(),
): string {
  return `${employeeId}.${sonKullanma}.${imza(employeeId, version, sonKullanma)}`;
}

export type LinkDurumu = {
  version: number;
  aktif: boolean;
  token: string | null;
  /** İstemcinin başına origin ekleyeceği yol */
  yol: string | null;
  /** Jetonun son kullanma zamanı (ISO) — kapatılmışsa null. */
  sonKullanma: string | null;
};

export async function linkDurumu(employeeId: string): Promise<LinkDurumu> {
  await tabloyuHazirla();
  const satirlar = await prisma.$queryRawUnsafe<{ version: number }[]>(
    `SELECT "version" FROM "${TABLO}" WHERE "employeeId" = ?`,
    employeeId
  );
  const version = Number(satirlar[0]?.version ?? 0);
  const aktif = version >= 0;

  if (!aktif) {
    return { version, aktif, token: null, yol: null, sonKullanma: null };
  }

  const son = sonKullanmaHesapla();
  const token = tokenUret(employeeId, version, son);
  return {
    version,
    aktif,
    token,
    yol: `/ekip/${token}`,
    sonKullanma: new Date(son).toISOString(),
  };
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
 * Geçersiz / kapatılmış / süresi geçmiş / eski sürüm → null.
 */
export async function tokenCoz(token: string): Promise<string | null> {
  const ham = String(token ?? "").trim();
  const parcalar = ham.split(".");

  const employeeId = parcalar[0] ?? "";
  if (!employeeId || !/^[A-Za-z0-9_-]+$/.test(employeeId)) return null;

  const durum = await linkDurumu(employeeId);
  if (!durum.aktif) return null;

  // Yeni biçim: <id>.<sonKullanma>.<imza>
  if (parcalar.length === 3) {
    const [, sonStr, gelen] = parcalar;
    if (!/^\d{10,16}$/.test(sonStr)) return null;
    if (!/^[A-Za-z0-9_-]{10,64}$/.test(gelen)) return null;

    const son = Number(sonStr);
    if (son <= Date.now()) return null; // süresi geçmiş

    return esitMi(gelen, imza(employeeId, durum.version, son)) ? employeeId : null;
  }

  // Eski biçim: <id>.<imza> — paylaşılmış linkler kırılmasın (süresiz).
  if (parcalar.length === 2) {
    const gelen = parcalar[1];
    if (!/^[A-Za-z0-9_-]{10,64}$/.test(gelen)) return null;
    return esitMi(gelen, imzaEski(employeeId, durum.version)) ? employeeId : null;
  }

  return null;
}

/** Sabit zamanlı karşılaştırma. */
function esitMi(gelen: string, beklenen: string): boolean {
  const a = Buffer.from(gelen);
  const b = Buffer.from(beklenen);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
