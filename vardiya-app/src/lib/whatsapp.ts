import type { Assignments, Employee, ShiftTemplate } from "./types";
import { assignmentKey } from "./types";
import { formatDayDate } from "./dates";
import { shiftHours } from "./shifts";

/** Telefonu wa.me formatına çevirir (90XXXXXXXXXX) */
export function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("90")) return digits;
  if (digits.startsWith("0")) return "90" + digits.slice(1);
  if (digits.length === 10) return "90" + digits;
  return digits;
}

/** Personelin haftalık program metnini üretir */
export function buildScheduleText(
  employee: Employee,
  weekDates: Date[],
  assignments: Assignments,
  shiftTemplates: ShiftTemplate[],
  businessName: string
): string {
  const byId = new Map(shiftTemplates.map((s) => [s.id, s]));
  const lines: string[] = [];
  let total = 0;

  for (const d of weekDates) {
    const shiftId = assignments[assignmentKey(employee.id, toISO(d))];
    if (!shiftId) continue;
    const shift = byId.get(shiftId);
    if (!shift) continue;
    total += shiftHours(shift);
    lines.push(`• ${formatDayDate(d)}: ${shift.name} (${shift.start}–${shift.end})`);
  }

  const header = `Merhaba ${employee.name}, ${businessName} bu haftaki vardiya programın:`;
  const body = lines.length ? lines.join("\n") : "• Bu hafta için atanmış vardiyan yok.";
  const footer = `\nToplam: ${total} saat\nDeğişiklik/izin için bana yazabilirsin.`;

  return `${header}\n\n${body}\n${footer}`;
}

/** wa.me bağlantısı üretir */
export function buildWhatsAppLink(phone: string, text: string): string {
  const normalized = normalizePhone(phone);
  const base = normalized ? `https://wa.me/${normalized}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
