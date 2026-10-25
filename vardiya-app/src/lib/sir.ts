/**
 * Gizli anahtar erişimi — tek kapı, **fail-closed**.
 *
 * Neden ayrı dosya: oturum çerezi imzası (`session.ts`), personel bağlantı
 * jetonu (`employee-link.ts`), 2FA yedek kod özeti (`iki-adim.ts`) ve ziyaret
 * sayacı tuzu (`visits.ts`) aynı anahtarı farklı yerlerde okuyordu. Üçünde
 * "anahtar yoksa sabit bir değere düş" yedeği vardı; bu, yanlış yapılandırmada
 * jetonların **tahmin edilebilir** hale gelmesi demekti.
 *
 * Yeni kural: anahtar yoksa veya çok kısaysa işlem yapılmaz, açık hata verilir.
 * Üretimde ayrıca `instrumentation.ts` süreç başlarken kontrol eder.
 */

/**
 * Anahtar için asgari uzunluk.
 *
 * 32 karakter ≈ 128 bit entropi (hex olarak üretildiğinde 64 karakter).
 * Eski eşik 16'ydı; HMAC-SHA256 için 128 bit altı önerilmez.
 */
export const ASGARI_ANAHTAR_UZUNLUGU = 32;

/** Eksik/kısa anahtarda kullanıcıya ve günlüğe gösterilecek açık mesaj. */
export const ANAHTAR_HATASI =
  "AUTH_SECRET tanımlı değil veya 32 karakterden kısa. Oturum çerezleri ve " +
  "personel bağlantıları imzalanamaz. .env dosyasına en az 32 karakterlik " +
  "rastgele bir değer ekleyin: node -e \"console.log(require('crypto')" +
  ".randomBytes(32).toString('hex'))\"";

/** Anahtar yeterli mi? (hata fırlatmadan kontrol — yönlendirme/yanıt için) */
export function authSecretVarMi(): boolean {
  return (process.env.AUTH_SECRET ?? "").trim().length >= ASGARI_ANAHTAR_UZUNLUGU;
}

/**
 * Anahtarı döner; yok veya kısaysa **hata fırlatır**.
 * Sessiz yedek anahtar yok — güvenlik yapılandırması eksikse işlem yapılmaz.
 */
export function authSecret(): string {
  const anahtar = (process.env.AUTH_SECRET ?? "").trim();
  if (anahtar.length < ASGARI_ANAHTAR_UZUNLUGU) {
    throw new Error(ANAHTAR_HATASI);
  }
  return anahtar;
}
