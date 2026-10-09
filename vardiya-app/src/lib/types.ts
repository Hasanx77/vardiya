// Uygulamanın temel veri tipleri
// (Next.js + TypeScript) — vardiya yönetimi SaaS

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

/** Havuzdaki açık vardiya (sahiplenilebilir) */
export type OpenShift = {
  id: string;
  date: string;
  shiftTemplateId: string;
  note: string;
};

/** Atamalar: anahtar = `${employeeId}__${YYYY-MM-DD}`, değer = shiftTemplateId */
export type Assignments = Record<string, string>;

export type AppData = {
  businessName: string;
  employees: Employee[];
  shiftTemplates: ShiftTemplate[];
  assignments: Assignments;
};

/** Atama anahtarı üretir */
export function assignmentKey(employeeId: string, isoDate: string): string {
  return `${employeeId}__${isoDate}`;
}

/** Sunucudan gelen atama satırı */
export type AssignmentRow = {
  employeeId: string;
  date: string;
  shiftTemplateId: string;
};

/** Personelin izin / değişim talebi */
export type TimeOffRequest = {
  id: string;
  employeeId: string;
  date: string;
  type: string; // izin | degisim
  note: string;
  status: string; // pending | approved | rejected
  /** Vardiya değişiminde hedef personel */
  targetEmployeeId?: string | null;
  createdAt: string;
};

/** Patronun ekibe duyurusu */
export type Announcement = {
  id: string;
  message: string;
  createdAt: string;
};

/** Personelin "müsait değilim" işaretlediği gün */
export type Availability = {
  employeeId: string;
  date: string;
  note: string;
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
  requests: TimeOffRequest[];
  announcements: Announcement[];
  availabilities: Availability[];
  dayNotes: DayNote[];
  openShifts: OpenShift[];
};
