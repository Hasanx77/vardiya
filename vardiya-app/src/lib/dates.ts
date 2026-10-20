// Tarih yardımcıları — yerel saat dilimine göre (UTC kayması olmadan)

export const DAY_NAMES_TR = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

export const DAY_SHORT_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export const MONTH_SHORT_TR = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

/** Date -> "YYYY-MM-DD" (yerel) */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ============================================================
   TÜRKİYE SAATİ (sunucu UTC olsa bile doğru gün)
   Sunucu saat dilimi UTC ise gece 00:00–03:00 arası "bugün" bir gün
   geride kalıyordu. Bu yardımcılar Europe/Istanbul'a göre hesaplar.
   ============================================================ */

const ISTANBUL = "Europe/Istanbul";

/** Türkiye saatine göre bugün: "YYYY-MM-DD" */
export function istanbulGunu(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** "YYYY-MM-DD" metnine gün ekler (saat dilimi kayması olmadan) */
export function gunEkleISO(iso: string, gun: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + gun));
  return t.toISOString().slice(0, 10);
}

/** Türkiye saatine göre bu haftanın pazartesi günü: "YYYY-MM-DD" */
export function haftaBasiISO(d = new Date()): string {
  const gun = istanbulGunu(d);
  const [y, m, day] = gun.split("-").map(Number);
  const t = new Date(Date.UTC(y, (m || 1) - 1, day || 1));
  const jsDay = t.getUTCDay(); // 0 = Pazar
  t.setUTCDate(t.getUTCDate() + (jsDay === 0 ? -6 : 1 - jsDay));
  return t.toISOString().slice(0, 10);
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

/** Verilen tarihin içinde bulunduğu haftanın pazartesi günü */
export function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const jsDay = copy.getDay(); // 0=Pazar, 1=Pazartesi...
  const diff = jsDay === 0 ? -6 : 1 - jsDay;
  return addDays(copy, diff);
}

/** offset: 0 = bu hafta, -1 = geçen hafta, 1 = gelecek hafta */
export function getWeekDates(offset: number): Date[] {
  const base = startOfWeek(new Date());
  const monday = addDays(base, offset * 7);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** "8 Eki" biçiminde kısa tarih */
export function formatShort(d: Date): string {
  return `${d.getDate()} ${MONTH_SHORT_TR[d.getMonth()]}`;
}

/** "Pzt 8 Eki" */
export function formatDayDate(d: Date): string {
  const idx = (d.getDay() + 6) % 7; // Pazartesi=0
  return `${DAY_SHORT_TR[idx]} ${d.getDate()} ${MONTH_SHORT_TR[d.getMonth()]}`;
}

/**
 * Haftanın okunabilir aralığı.
 *
 * Ay/yıl sınırını geçen haftalarda sol tarafın ayı da yazılır; aksi halde
 * "29 – 4 Eki 2026" gibi belirsiz bir metin çıkıyordu.
 */
export function formatWeekRange(dates: Date[]): string {
  const first = dates[0];
  const last = dates[dates.length - 1];
  const ayniYil = first.getFullYear() === last.getFullYear();
  const ayniAy = first.getMonth() === last.getMonth();

  if (ayniYil && ayniAy) {
    return `${first.getDate()} – ${last.getDate()} ${MONTH_SHORT_TR[last.getMonth()]} ${last.getFullYear()}`;
  }

  const sol = `${first.getDate()} ${MONTH_SHORT_TR[first.getMonth()]}${
    ayniYil ? "" : ` ${first.getFullYear()}`
  }`;
  const sag = `${last.getDate()} ${MONTH_SHORT_TR[last.getMonth()]} ${last.getFullYear()}`;
  return `${sol} – ${sag}`;
}
