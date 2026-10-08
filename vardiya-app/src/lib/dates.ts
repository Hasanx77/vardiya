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

/** Haftanın okunabilir aralığı: "6 – 12 Eki 2026" */
export function formatWeekRange(dates: Date[]): string {
  const first = dates[0];
  const last = dates[6];
  const sameMonth = first.getMonth() === last.getMonth();
  const left = `${first.getDate()}${sameMonth ? "" : " " + MONTH_SHORT_TR[first.getMonth()]}`;
  const right = `${last.getDate()} ${MONTH_SHORT_TR[last.getMonth()]} ${last.getFullYear()}`;
  return `${left} – ${right}`;
}
