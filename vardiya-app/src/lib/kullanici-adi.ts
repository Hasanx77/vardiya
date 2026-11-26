/**
 * Kullanıcı adı üretimi ve doğrulaması.
 *
 * Kural (26 Kas 2026 güncellendi): **Türkçe ve diğer Unicode harfler serbest**.
 * Eskiden ad ASCII'ye indiriliyordu ("ışıl" → "isil"); patron "Türkçe
 * karakterlerde sıkıntı olmasın" dediği için artık korunuyor.
 *
 * Kurallar:
 *   • 3–24 karakter
 *   • Harf (her dil), rakam, nokta, tire, alt çizgi
 *   • Başında ve sonunda harf/rakam
 *   • Boşluklar tireye çevrilir ("ışıl öğüt" → "ışıl-öğüt")
 *   • Türkçe küçük harfe çevrilir (I → ı, İ → i)
 */
import { metinNormalize } from "./metin";

/** Ad için izinli karakter deseni — tüm Unicode harfleri kapsar. */
const DESEN = /^[\p{L}\p{N}][\p{L}\p{N}._-]*[\p{L}\p{N}]$/u;

export function kullaniciAdiTemizle(ham: string): string {
  return metinNormalize(ham, 64)
    .toLocaleLowerCase("tr")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}._-]/gu, "")
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/[^\p{L}\p{N}]+$/u, "")
    .slice(0, 24);
}

/** Geçerli mi? (temizlenmiş hâli kurallara uyuyor mu) */
export function kullaniciAdiGecerliMi(ham: string): boolean {
  const temiz = kullaniciAdiTemizle(ham);
  return temiz.length >= 3 && temiz.length <= 24 && DESEN.test(temiz);
}

/** Hata mesajı (geçerliyse null). */
export function kullaniciAdiHatasi(ham: string): string | null {
  const temiz = kullaniciAdiTemizle(ham);
  if (temiz.length < 3) return "Kullanıcı adı en az 3 karakter olmalı.";
  if (temiz.length > 24) return "Kullanıcı adı en fazla 24 karakter olabilir.";
  if (!DESEN.test(temiz)) {
    return "Kullanıcı adı harf veya rakamla başlayıp bitmeli; arada nokta, tire, alt çizgi olabilir. Türkçe karakterler serbest.";
  }
  return null;
}

/**
 * E-postadan başlangıç adı üretir (`hasan.mum@gmail.com` → `hasan.mum`).
 * Google ile ilk girişte kullanılır; çakışırsa sonuna sayı eklenir.
 */
export function epostadanAd(email: string): string {
  const yerel = (email.split("@")[0] ?? "").replace(/\+.*/, "");
  const temiz = kullaniciAdiTemizle(yerel);
  return temiz.length >= 3 ? temiz : "kullanici";
}

/** Çakışma varsa `ad`, `ad2`, `ad3`… sırasıyla dener. */
export function siraylaAd(ad: string, deneme: number): string {
  if (deneme === 0) return ad;
  const ek = String(deneme + 1);
  const taban = ad.slice(0, Math.max(3, 24 - ek.length));
  return `${taban}${ek}`;
}
