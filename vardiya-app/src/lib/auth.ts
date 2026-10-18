/**
 * Basit oturum/paylaşılan-şifre kapısı.
 *
 * Neden bu yaklaşım: uygulama tek işletme + tek yönetici (işveren) için yazıldı.
 * Kullanıcı tablosu, e-posta doğrulama, şifre sıfırlama gibi ağır bir kimlik
 * sistemi MVP için gereğinden fazla. Burada:
 *   - Panel şifresi ortam değişkeninde tutulur (APP_PASSWORD).
 *   - Girişte HMAC ile imzalı, son kullanma tarihli bir çerez verilir.
 *   - İmza anahtarı AUTH_SECRET; çerezde şifre geçmez.
 *
 * Web Crypto (crypto.subtle) kullanılıyor çünkü aynı kod hem Edge (proxy/middleware)
 * hem de Node.js (route handler) tarafında çalışmalı.
 */

const enc = new TextEncoder();

export const COOKIE_NAME = "vardiya_oturum";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 gün

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(message: string): Promise<string> {
  const secret = process.env.AUTH_SECRET ?? "";
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toHex(sig);
}

/** Sabit zamanlı karşılaştırma (zamanlama sızıntısını azaltır). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Şifre doğru mu? (APP_PASSWORD boşsa kapı açılmaz — güvenli varsayılan.) */
export function checkPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD ?? "";
  if (!expected || !input) return false;
  return safeEqual(input, expected);
}

/** Giriş başarılıysa verilecek çerez değeri: "<son kullanma>.<imza>" */
export async function createToken(): Promise<string> {
  const exp = Date.now() + COOKIE_MAX_AGE * 1000;
  return `${exp}.${await hmac(String(exp))}`;
}

/** Çerez geçerli mi? (imza doğru + süresi geçmemiş) */
export async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token || !process.env.AUTH_SECRET) return false;
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  return safeEqual(sig, await hmac(expStr));
}
