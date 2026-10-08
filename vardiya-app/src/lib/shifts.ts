import type { ShiftTemplate } from "./types";

/** Varsayılan vardiya şablonları (HORECA dostu) */
export const DEFAULT_SHIFTS: ShiftTemplate[] = [
  { id: "sabah", name: "Sabah", start: "09:00", end: "17:00", color: "amber" },
  { id: "aksam", name: "Akşam", start: "17:00", end: "01:00", color: "violet" },
  { id: "tamgun", name: "Tam Gün", start: "10:00", end: "22:00", color: "rose" },
  { id: "ara", name: "Ara Vardiya", start: "12:00", end: "20:00", color: "cyan" },
];

/** Bir vardiyanın saat cinsinden süresi (gece yarısını aşanlar dahil) */
export function shiftHours(shift: { start: string; end: string }): number {
  const [sh, sm] = shift.start.split(":").map(Number);
  const [eh, em] = shift.end.split(":").map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes <= 0) minutes += 24 * 60; // gece yarısını aşan vardiya
  return minutes / 60;
}

/** Haftalık yasal sınır (İş Kanunu: haftalık 45 saat) */
export const WEEKLY_LIMIT_HOURS = 45;

export function shiftLabel(shift: ShiftTemplate): string {
  return `${shift.name} (${shift.start}–${shift.end})`;
}
