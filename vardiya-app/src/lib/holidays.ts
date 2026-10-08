// Türkiye resmî tatilleri (2026–2027).
// NOT: Dini bayramlar her yıl ~11 gün kayar; yeni yıl için listeyi güncelleyin.

export type Holiday = { date: string; name: string; halfDay?: boolean };

export const TR_HOLIDAYS: Holiday[] = [
  // ---- 2026 ----
  { date: "2026-01-01", name: "Yılbaşı" },
  { date: "2026-03-19", name: "Ramazan Bayramı Arifesi", halfDay: true },
  { date: "2026-03-20", name: "Ramazan Bayramı 1. Gün" },
  { date: "2026-03-21", name: "Ramazan Bayramı 2. Gün" },
  { date: "2026-03-22", name: "Ramazan Bayramı 3. Gün" },
  { date: "2026-04-23", name: "Ulusal Egemenlik ve Çocuk Bayramı" },
  { date: "2026-05-01", name: "Emek ve Dayanışma Günü" },
  { date: "2026-05-19", name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı" },
  { date: "2026-05-26", name: "Kurban Bayramı Arifesi", halfDay: true },
  { date: "2026-05-27", name: "Kurban Bayramı 1. Gün" },
  { date: "2026-05-28", name: "Kurban Bayramı 2. Gün" },
  { date: "2026-05-29", name: "Kurban Bayramı 3. Gün" },
  { date: "2026-05-30", name: "Kurban Bayramı 4. Gün" },
  { date: "2026-07-15", name: "Demokrasi ve Millî Birlik Günü" },
  { date: "2026-08-30", name: "Zafer Bayramı" },
  { date: "2026-10-29", name: "Cumhuriyet Bayramı" },

  // ---- 2027 ----
  { date: "2027-01-01", name: "Yılbaşı" },
  { date: "2027-03-08", name: "Ramazan Bayramı Arifesi", halfDay: true },
  { date: "2027-03-09", name: "Ramazan Bayramı 1. Gün" },
  { date: "2027-03-10", name: "Ramazan Bayramı 2. Gün" },
  { date: "2027-03-11", name: "Ramazan Bayramı 3. Gün" },
  { date: "2027-04-23", name: "Ulusal Egemenlik ve Çocuk Bayramı" },
  { date: "2027-05-01", name: "Emek ve Dayanışma Günü" },
  { date: "2027-05-15", name: "Kurban Bayramı Arifesi", halfDay: true },
  { date: "2027-05-16", name: "Kurban Bayramı 1. Gün" },
  { date: "2027-05-17", name: "Kurban Bayramı 2. Gün" },
  { date: "2027-05-18", name: "Kurban Bayramı 3. Gün" },
  {
    date: "2027-05-19",
    name: "Kurban Bayramı 4. Gün / Atatürk'ü Anma, Gençlik ve Spor Bayramı",
  },
  { date: "2027-07-15", name: "Demokrasi ve Millî Birlik Günü" },
  { date: "2027-08-30", name: "Zafer Bayramı" },
  { date: "2027-10-29", name: "Cumhuriyet Bayramı" },
];

const HOLIDAY_MAP = new Map(TR_HOLIDAYS.map((h) => [h.date, h]));

export function getHoliday(iso: string): Holiday | undefined {
  return HOLIDAY_MAP.get(iso);
}

/** Tam gün resmî tatil mi? (arife/yarım gün hariç) */
export function isFullHoliday(iso: string): boolean {
  const h = HOLIDAY_MAP.get(iso);
  return !!h && !h.halfDay;
}
