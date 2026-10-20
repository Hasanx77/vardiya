/**
 * Oturum (session) çerezi — Edge ve Node tarafında çalışan ortak katman.
 *
 * Neden ayrı dosya: `middleware` Edge çalışma zamanında koşar ve orada Node'un
 * `crypto` modülü yoktur. Bu yüzden imzalama/doğrulama **Web Crypto** ile yapılır
 * ve şifre hash'leme (scrypt) gibi Node'a özel işler `lib/auth.ts`'te kalır.
 *
 * Çerez değeri: `<kullaniciId>.<sonKullanma>.<imza>`
 *   - `sonKullanma` : ms cinsinden zaman damgası
 *   - `imza`        : HMAC-SHA256(AUTH_SECRET, "<kullaniciId>.<sonKullanma>")
 * Böylece çerez değiştirilirse imza tutmaz; şifre çerezde hiç geçmez.
 */

export const COOKIE_NAME = "vardiya_oturum";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 gün

const enc = new TextEncoder();

/**
 * Oturum imzası için ortam değişkeni.
 *
 * 🔒 Bu değer yoksa (veya çok kısaysa) imzalı çerez üretilemez. Sessizce boş
 * anahtarla imzalamak "giriş yaptım ama giriş yapılmamış görünüyor" hatasına
 * yol açıyordu; bu yüzden burada açıkça hata veriyoruz ve giriş/kayıt uçları
 * önceden kontrol ediyor.
 */
const ASGARI_ANAHTAR_UZUNLUGU = 16;

export function oturumAltyapisiHazir(): boolean {
  return (process.env.AUTH_SECRET ?? "").trim().length >= ASGARI_ANAHTAR_UZUNLUGU;
}

function gizliAnahtar(): string {
  const anahtar = (process.env.AUTH_SECRET ?? "").trim();
  if (anahtar.length < ASGARI_ANAHTAR_UZUNLUGU) {
    throw new Error("AUTH_SECRET tanımlı değil veya çok kısa (en az 16 karakter).");
  }
  return anahtar;
}

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function imzaUret(veri: string): Promise<string> {
  const anahtar = await crypto.subtle.importKey(
    "raw",
    enc.encode(gizliAnahtar()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", anahtar, enc.encode(veri)));
}

/** Sabit zamanlı karşılaştırma (zamanlama sızıntısını azaltır). */
function esitMi(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let fark = 0;
  for (let i = 0; i < a.length; i++) fark |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return fark === 0;
}

/** Kullanıcı için imzalı oturum çerezi değeri üretir. */
export async function oturumTokeni(kullaniciId: string): Promise<string> {
  const son = Date.now() + COOKIE_MAX_AGE * 1000;
  const govde = `${kullaniciId}.${son}`;
  return `${govde}.${await imzaUret(govde)}`;
}

/** Çerez geçerliyse kullanıcı id'sini döner, aksi halde null. */
export async function tokenKullanici(token: string | undefined): Promise<string | null> {
  if (!token || !oturumAltyapisiHazir()) return null;
  const parcalar = token.split(".");
  if (parcalar.length !== 3) return null;
  const [kullaniciId, sonStr, imza] = parcalar;
  const son = Number(sonStr);
  if (!kullaniciId || !Number.isFinite(son) || son < Date.now()) return null;
  if (!esitMi(imza, await imzaUret(`${kullaniciId}.${sonStr}`))) return null;
  return kullaniciId;
}
