// Uygulamanın temel veri tipleri
// Model: işveren yönetir; personel yalnızca görüntüler.

export type ColorKey =
  | "sky"
  | "emerald"
  | "amber"
  | "violet"
  | "rose"
  | "cyan"
  | "lime"
  | "orange"
  | "fuchsia"
  | "teal";

/** Bir çalışan (personel) */
export type Employee = {
  id: string;
  name: string;
  /** Telefon — serbest format girilebilir, gönderirken normalize edilir */
  phone: string;
  /** Görev / pozisyon (ör. Barista, Garson, Şef) */
  role: string;
  color: ColorKey;
  /** Saatlik ücret (₺) — 0 ise maliyet hesaplanmaz */
  hourlyWage: number;
  /** Yıllık izin hakkı (gün) */
  annualLeaveDays: number;
};

/** Yeniden kullanılabilir vardiya şablonu (ör. Sabah 09:00-17:00) */
export type ShiftTemplate = {
  id: string;
  name: string;
  /** "HH:MM" */
  start: string;
  /** "HH:MM" */
  end: string;
  color: ColorKey;
  /** Hedeflenen en az kişi sayısı (0 = hedef yok) */
  minStaff: number;
};

/** Atamalar: anahtar = `${employeeId}__${YYYY-MM-DD}`, değer = shiftTemplateId */
export type Assignments = Record<string, string>;

/** Sunucudan gelen atama satırı */
export type AssignmentRow = {
  employeeId: string;
  date: string;
  shiftTemplateId: string;
};

/** İşverenin ekibe duyurusu */
export type Announcement = {
  id: string;
  message: string;
  createdAt: string;
};

/** Gün bazlı not */
export type DayNote = {
  date: string;
  note: string;
};

/** /api/state yanıtı */
export type StatePayload = {
  business: { id: string; name: string };
  employees: Employee[];
  shiftTemplates: ShiftTemplate[];
  assignments: AssignmentRow[];
  announcements: Announcement[];
  dayNotes: DayNote[];
};

/** Atama anahtarı üretir */
export function assignmentKey(employeeId: string, isoDate: string): string {
  return `${employeeId}__${isoDate}`;
}
