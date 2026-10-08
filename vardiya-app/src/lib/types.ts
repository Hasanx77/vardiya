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
  createdAt: string;
};

/** /api/state yanıtı */
export type StatePayload = {
  business: { id: string; name: string };
  employees: Employee[];
  shiftTemplates: ShiftTemplate[];
  assignments: AssignmentRow[];
  requests: TimeOffRequest[];
};
