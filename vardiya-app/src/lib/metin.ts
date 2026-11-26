/**
 * Metin girişleri — **Unicode dostu** normalizasyon.
 *
 * Patron isteği (26 Kas 2026): "işletme adı vs girerken global dil istiyorum;
 * İngilizce değil, Türkçe karakterleri kullanırken sıkıntı yaşamak istemiyorum."
 *
 * Ne yapıyor:
 *   • **NFC normalizasyonu:** "ş" iki farklı kodla gelebilir (tek karakter ya da
 *     s + birleşik işaret). İkisi görsel olarak aynı ama veritabanında farklı
 *     olur; NFC bunları tek biçime indirir. Böylece arama/karşılaştırma tutarlı.
 *   • **Kontrol karakterlerini** temizler (satır sonu ve sekme korunur).
 *   • **Uzunluk** sınırını `slice` yerine kırpmayla uygular (kelime ortasında
 *     kesilse bile baştaki/sondaki boşluk kalmaz).
 *
 * Hiçbir harf **silinmez**: Türkçe (ı, İ, ş, ğ, ü, ö, ç), Arapça, Kiril, emoji
 * ve diğer Unicode harfler olduğu gibi saklanır.
 */

/** Görünmez kontrol karakterleri (satır sonu, sekme ve normal boşluk hariç). */
const KONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function metinNormalize(deger: unknown, enFazla?: number): string {
  let s = String(deger ?? "").normalize("NFC").replace(KONTROL, "").trim();
  if (enFazla && enFazla > 0 && s.length > enFazla) {
    s = s.slice(0, enFazla).trimEnd();
  }
  return s;
}

/** Çok satırlı alanlar (duyuru, not): satır sonları korunur, fazla boş satır kırpılır. */
export function metinNormalizeCokSatir(deger: unknown, enFazla = 500): string {
  return metinNormalize(deger, enFazla)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

/** Telefon: rakam, boşluk, +, -, ( ) dışındaki her şeyi atar; Türkçe harf girilse de bozulmaz. */
export function telefonTemizle(deger: unknown, enFazla = 30): string {
  return metinNormalize(deger, enFazla)
    .replace(/[^\d+\-()\s]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Ad benzeri metinlerde en az bir harf var mı? (rakam-only adları reddetmek için) */
export function harfVarMi(deger: string): boolean {
  return /\p{L}/u.test(deger);
}
