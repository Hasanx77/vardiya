// Mevzuat / çakışma kuralları — saf (yan etkisiz) fonksiyonlar.
// İş Kanunu (4857) referansları:
//   • Haftalık çalışma süresi: 45 saat (m.63)
//   • Fazla mesai ücreti: %50 zamlı (m.41)
//   • Günlük (iki vardiya arası) en az dinlenme: 11 saat (m.69)
// Bu modül sunucuya bağımlı değildir; panelde de, testlerde de kullanılabilir.

import { DAY_SHORT_TR } from "./dates";
import { shiftHours, WEEKLY_LIMIT_HOURS } from "./shifts";

/** İki vardiya arası en az dinlenme süresi (saat) — 4857 m.69 */
export const MIN_DAILY_REST_HOURS = 11;
/** Fazla mesai çarpanı (normal ücretin %50 fazlası → 1,5x) — 4857 m.41 */
export const OVERTIME_MULTIPLIER = 1.5;

export type ComplianceIssueType =
  | "cift_vardiya"
  | "dinlenme"
  | "fazla_mesai";

export type ComplianceSeverity = "error" | "warn";

export type ComplianceIssue = {
  employeeId: string;
  type: ComplianceIssueType;
  severity: ComplianceSeverity;
  /** Uyarının ilişkili olduğu gün (YYYY-MM-DD) */
  date: string;
  message: string;
};

export type ShiftLike = { id: string; name: string; start: string; end: string };
export type AssignmentLike = {
  employeeId: string;
  date: string;
  shiftTemplateId: string;
};

export type WeekAnalysisInput = {
  employees: { id: string; name: string }[];
  shifts: ShiftLike[];
  assignments: AssignmentLike[];
  /** Sıralı hafta günleri, ISO (YYYY-MM-DD) — Pzt…Paz */
  weekDates: string[];
  /** Haftanın ilk gününden bir önceki gün (dinlenme kontrolü için, opsiyonel) */
  previousDate?: string;
};

export type EmployeeWeekResult = {
  employeeId: string;
  weeklyHours: number;
  /** 45 saati aşan kısım (0 ise yok) */
  overtimeHours: number;
  issues: ComplianceIssue[];
};

export type WeekAnalysis = {
  perEmployee: Map<string, EmployeeWeekResult>;
  issues: ComplianceIssue[];
  totalOvertimeHours: number;
};

/** "HH:MM" -> gün başından itibaren dakika */
export function timeToMinutes(value: string): number {
  const [h, m] = String(value ?? "").split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/**
 * Vardiyanın başlangıç/bitiş dakikaları.
 * Gece yarısını aşan vardiyada bitiş, gün başından itibaren 1440'tan büyük olur
 * (ör. 17:00–01:00 → başlangıç 1020, bitiş 1500).
 */
export function shiftBounds(shift: { start: string; end: string }): {
  start: number;
  end: number;
} {
  const start = timeToMinutes(shift.start);
  let end = timeToMinutes(shift.end);
  if (end <= start) end += 24 * 60;
  return { start, end };
}

/**
 * Bir günün vardiyası ile ertesi günün vardiyası arasındaki dinlenme (saat).
 * `next`, `prev` gününden tam 1 gün sonra kabul edilir.
 * Negatif değer vardiyaların çakıştığını gösterir.
 */
export function restHoursBetween(
  prev: { start: string; end: string },
  next: { start: string; end: string }
): number {
  const p = shiftBounds(prev);
  const n = shiftBounds(next);
  const restMinutes = 24 * 60 + n.start - p.end;
  return restMinutes / 60;
}

/** İki ISO tarih (YYYY-MM-DD) arasındaki gün farkı (b - a) */
export function isoDiffDays(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const ta = Date.UTC(ay, (am || 1) - 1, ad || 1);
  const tb = Date.UTC(by, (bm || 1) - 1, bd || 1);
  return Math.round((tb - ta) / 86_400_000);
}

/** "Pzt 08 Eki" biçiminde kısa etiket (mesajlarda okunabilirlik için) */
function dayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  const idx = (date.getUTCDay() + 6) % 7; // Pazartesi = 0
  return `${DAY_SHORT_TR[idx]} ${d}`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Bir haftayı tüm personel için mevzuat/çakışma açısından analiz eder.
 * - Aynı gün birden fazla vardiya (çakışma)
 * - İki gün arası 11 saatten az dinlenme
 * - Haftalık 45 saat üstü (fazla mesai)
 */
export function analyzeWeek(input: WeekAnalysisInput): WeekAnalysis {
  const { employees, shifts, assignments, weekDates, previousDate } = input;

  const shiftById = new Map(shifts.map((s) => [s.id, s]));
  const weekSet = new Set(weekDates);

  // employeeId__date -> o güne ait atamalar (dizi; çakışma tespiti için)
  const byEmployeeDay = new Map<string, AssignmentLike[]>();
  for (const a of assignments) {
    const shift = shiftById.get(a.shiftTemplateId);
    if (!shift) continue;
    const key = `${a.employeeId}__${a.date}`;
    const list = byEmployeeDay.get(key);
    if (list) list.push(a);
    else byEmployeeDay.set(key, [a]);
  }

  const perEmployee = new Map<string, EmployeeWeekResult>();
  const allIssues: ComplianceIssue[] = [];
  let totalOvertimeHours = 0;

  for (const emp of employees) {
    const issues: ComplianceIssue[] = [];

    const dayAssignments = (iso: string): AssignmentLike[] =>
      byEmployeeDay.get(`${emp.id}__${iso}`) ?? [];

    const shiftOf = (a: AssignmentLike) => shiftById.get(a.shiftTemplateId)!;

    // 1) Haftalık toplam + fazla mesai
    let weeklyHours = 0;
    for (const iso of weekDates) {
      for (const a of dayAssignments(iso)) {
        weeklyHours += shiftHours(shiftOf(a));
      }
    }
    weeklyHours = round1(weeklyHours);
    const overtimeHours = round1(Math.max(0, weeklyHours - WEEKLY_LIMIT_HOURS));
    if (overtimeHours > 0) {
      issues.push({
        employeeId: emp.id,
        type: "fazla_mesai",
        severity: "warn",
        date: weekDates[weekDates.length - 1] ?? "",
        message: `Haftalık ${WEEKLY_LIMIT_HOURS} saati ${overtimeHours} saat aştı (fazla mesai).`,
      });
    }

    // 2) Aynı gün birden fazla vardiya (çakışma)
    for (const iso of weekDates) {
      const list = dayAssignments(iso);
      if (list.length <= 1) continue;
      const names = list.map((a) => shiftOf(a).name).join(" + ");
      issues.push({
        employeeId: emp.id,
        type: "cift_vardiya",
        severity: "error",
        date: iso,
        message: `${dayLabel(iso)} günü aynı güne birden fazla vardiya atanmış (${names}).`,
      });
    }

    // 3) İki gün arası 11 saat dinlenme kuralı
    const seq = (previousDate ? [previousDate, ...weekDates] : [...weekDates]).filter(
      (iso) => dayAssignments(iso).length > 0
    );
    for (let i = 0; i < seq.length - 1; i++) {
      const prevIso = seq[i];
      const nextIso = seq[i + 1];
      if (isoDiffDays(prevIso, nextIso) !== 1) continue; // ardışık gün değilse kural işlemez

      const prevShifts = dayAssignments(prevIso);
      const nextShifts = dayAssignments(nextIso);
      // En kötü (en kısa) dinlenmeyi bul
      let minRest = Infinity;
      for (const p of prevShifts) {
        for (const n of nextShifts) {
          minRest = Math.min(minRest, restHoursBetween(shiftOf(p), shiftOf(n)));
        }
      }
      if (!Number.isFinite(minRest)) continue;
      if (minRest < MIN_DAILY_REST_HOURS) {
        issues.push({
          employeeId: emp.id,
          type: "dinlenme",
          severity: "error",
          date: nextIso,
          message:
            `${dayLabel(prevIso)} → ${dayLabel(nextIso)} arası dinlenme ${round1(
              Math.max(0, minRest)
            )} saat; en az ${MIN_DAILY_REST_HOURS} saat olmalı.`,
        });
      }
    }

    // Sıralama: önce hatalar, sonra tarih
    issues.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "error" ? -1 : 1;
      return a.date.localeCompare(b.date);
    });

    perEmployee.set(emp.id, {
      employeeId: emp.id,
      weeklyHours,
      overtimeHours,
      issues,
    });
    allIssues.push(...issues);
    totalOvertimeHours += overtimeHours;
  }

  allIssues.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "error" ? -1 : 1;
    return a.date.localeCompare(b.date);
  });

  return { perEmployee, issues: allIssues, totalOvertimeHours: round1(totalOvertimeHours) };
}
