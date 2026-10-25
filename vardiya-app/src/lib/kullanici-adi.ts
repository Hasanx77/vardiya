/**
 * Kullanıcı adı üretimi ve doğrulaması.
 *
 * Amaç: kayıtta e-posta yerine **kısa bir ad** göstermek ("hasan" gibi).
 * Kurallar: 3-24 karakter, küçük harf, harf/rakam/nokta/alt çizgi; baş ve son
 * karakter harf ya da rakam. Türkçe karakterler sadeleştirilir (ş → s).
 */

const TR_HARF: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
  Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u",
};

export function kullaniciAdiTemizle(ham: string): string {
  const sade = (ham ?? "")
    .split("")
    .map((h) => TR_HARF[h] ?? h)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[^a-z0-9]+/, "")
    .replace(/[^a-z0-9]+$/, "")
    .slice(0, 24);
  return sade;
}

/** Geçerli mi? (temizlenmiş hâli kurallara uyuyor mu) */
export function kullaniciAdiGecerliMi(ham: string): boolean {
  const temiz = kullaniciAdiTemizle(ham);
  return temiz.length >= 3 && temiz.length <= 24 && /^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(temiz);
}

/** Hata mesajı (geçerliyse null). */
export function kullaniciAdiHatasi(ham: string): string | null {
  const temiz = kullaniciAdiTemizle(ham);
  if (temiz.length < 3) return "Kullanıcı adı en az 3 karakter olmalı.";
  if (temiz.length > 24) return "Kullanıcı adı en fazla 24 karakter olabilir.";
  if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(temiz)) {
    return "Kullanıcı adı harf veya rakamla başlayıp bitmeli; arada nokta, tire, alt çizgi olabilir.";
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
