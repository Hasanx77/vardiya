/**
 * Uygulama başlangıç kontrolleri (Next `instrumentation` kancası).
 *
 * Amaç: eksik güvenlik yapılandırmasıyla **uygulamanın hiç açılmaması**.
 * Aksi halde oturum çerezleri imzalanamaz, personel bağlantıları üretilemez ve
 * hata ancak ilk kullanıcı girişinde fark edilir.
 *
 * Yalnız üretimde çalışır: geliştirmede `.env` olmadan da çalışabilmek gerekir.
 * (Geliştirmede de anahtar yoksa ilgili işlem `authSecret()` üzerinden hata verir.)
 */
export async function register(): Promise<void> {
  if (process.env.NODE_ENV !== "production") return;

  // Dinamik import: anahtar yardımcısı yalnız gerektiğinde yüklensin.
  const { authSecretVarMi, ANAHTAR_HATASI } = await import("./lib/sir");
  if (!authSecretVarMi()) {
    // Bilinçli olarak fırlatılıyor: yanlış yapılandırmayla yayına çıkılmasın.
    throw new Error(ANAHTAR_HATASI);
  }
}
