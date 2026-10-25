/**
 * Haftalık planın taslak/yayın durumu — saf yardımcılar.
 *
 * Kural (patron kararı, 24 Eki 2026): plan **hafta bazında** yayınlanır.
 * Yayınlanmamış (taslak) hafta personel bağlantısında ve `.ics` takviminde
 * **görünmez**; böylece yarım kalmış plan ekibe sızmaz.
 *
 * Bu dosyada veritabanı yok — burada tutulan tek şey doğrulama ve filtre
 * mantığı; böylece birim testleri veritabanı olmadan çalışır.
 */

const ISO_DESENI = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" metnini UTC gece yarısına çevirir (saat dilimi kayması olmadan). */
function isoToUtc(iso: string): Date | null {
  if (!ISO_DESENI.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  if (Number.isNaN(t.getTime())) return null;
  // "2026-02-31" gibi taşan tarihleri ele: geri okunduğunda aynı olmalı.
  if (t.toISOString().slice(0, 10) !== iso) return null;
  return t;
}

/** Verilen ISO tarihin içinde bulunduğu haftanın pazartesi günü: "YYYY-MM-DD". */
export function isoHaftaBasi(iso: string): string | null {
  const t = isoToUtc(iso);
  if (!t) return null;
  const jsDay = t.getUTCDay(); // 0 = Pazar
  t.setUTCDate(t.getUTCDate() + (jsDay === 0 ? -6 : 1 - jsDay));
  return t.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" geçerli bir tarih **ve pazartesi** mi? */
export function haftaBasiGecerliMi(iso: string): boolean {
  const t = isoToUtc(iso);
  return !!t && t.getUTCDay() === 1 && isoHaftaBasi(iso) === iso;
}

/** Yayınlanmış hafta listesi → hızlı arama kümesi. */
export function yayinKumesi(publishedWeeks: readonly string[]): Set<string> {
  return new Set(publishedWeeks);
}

/** Bir günün vardiyası yayında mı? (Tarihin haftası yayınlandıysa evet.) */
export function gunYayinda(date: string, published: Set<string>): boolean {
  const hafta = isoHaftaBasi(date);
  return !!hafta && published.has(hafta);
}

/**
 * Personel tarafına gönderilecek kayıtları süzer: yalnızca yayınlanmış
 * haftalardaki vardiyalar kalır.
 */
export function yayindakiKayitlar<T extends { date: string }>(
  rows: readonly T[],
  publishedWeeks: readonly string[]
): T[] {
  const published = yayinKumesi(publishedWeeks);
  return rows.filter((r) => gunYayinda(r.date, published));
}

/** "24 Ekim 2026 14:05" biçiminde yayın zamanı (Türkiye saati). */
export function yayinZamaniMetni(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
