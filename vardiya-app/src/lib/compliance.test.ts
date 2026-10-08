import { describe, it, expect } from "vitest";
import {
  analyzeWeek,
  isoDiffDays,
  MIN_DAILY_REST_HOURS,
  NIGHT_LIMIT_HOURS,
  nightHours,
  OVERTIME_MULTIPLIER,
  restHoursBetween,
  shiftBounds,
  timeToMinutes,
} from "./compliance";

const shifts = [
  { id: "sabah", name: "Sabah", start: "09:00", end: "17:00" },
  { id: "aksam", name: "Akşam", start: "17:00", end: "01:00" },
];

const weekDates = [
  "2026-10-05",
  "2026-10-06",
  "2026-10-07",
  "2026-10-08",
  "2026-10-09",
  "2026-10-10",
  "2026-10-11",
];

const employees = [
  { id: "e1", name: "Ayşe" },
  { id: "e2", name: "Mehmet" },
];

describe("timeToMinutes / shiftBounds", () => {
  it("saati dakikaya çevirir", () => {
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("00:00")).toBe(0);
  });

  it("gece yarısını aşan vardiyada bitiş 1440'tan büyük olur", () => {
    expect(shiftBounds({ start: "17:00", end: "01:00" })).toEqual({ start: 1020, end: 1500 });
  });

  it("gündüz vardiyası normal sınırlar", () => {
    expect(shiftBounds({ start: "09:00", end: "17:00" })).toEqual({ start: 540, end: 1020 });
  });
});

describe("restHoursBetween", () => {
  it("akşam → ertesi gün sabah = 8 saat dinlenme (ihlal)", () => {
    expect(restHoursBetween({ start: "17:00", end: "01:00" }, { start: "09:00", end: "17:00" })).toBe(
      8
    );
  });

  it("sabah → ertesi gün sabah = 16 saat dinlenme (uygun)", () => {
    expect(restHoursBetween({ start: "09:00", end: "17:00" }, { start: "09:00", end: "17:00" })).toBe(
      16
    );
  });
});

describe("isoDiffDays", () => {
  it("aynı gün 0, ertesi gün 1 döner", () => {
    expect(isoDiffDays("2026-10-05", "2026-10-05")).toBe(0);
    expect(isoDiffDays("2026-10-05", "2026-10-06")).toBe(1);
  });
});

describe("analyzeWeek", () => {
  it("temiz haftada uyarı üretmez", () => {
    const result = analyzeWeek({
      employees: [employees[0]],
      shifts,
      assignments: [
        { employeeId: "e1", date: "2026-10-05", shiftTemplateId: "sabah" },
        { employeeId: "e1", date: "2026-10-06", shiftTemplateId: "sabah" },
        { employeeId: "e1", date: "2026-10-07", shiftTemplateId: "sabah" },
      ],
      weekDates,
    });
    expect(result.issues).toHaveLength(0);
    expect(result.perEmployee.get("e1")?.weeklyHours).toBe(24);
    expect(result.perEmployee.get("e1")?.overtimeHours).toBe(0);
  });

  it("iki gün arası 11 saatten az dinlenmeyi yakalar", () => {
    const result = analyzeWeek({
      employees: [employees[0]],
      shifts,
      assignments: [
        { employeeId: "e1", date: "2026-10-05", shiftTemplateId: "aksam" },
        { employeeId: "e1", date: "2026-10-06", shiftTemplateId: "sabah" },
      ],
      weekDates,
    });
    const issue = result.issues.find((i) => i.type === "dinlenme");
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe("error");
    expect(issue?.date).toBe("2026-10-06");
  });

  it("hafta başından önceki günle dinlenmeyi de kontrol eder (previousDate)", () => {
    const result = analyzeWeek({
      employees: [employees[0]],
      shifts,
      assignments: [
        { employeeId: "e1", date: "2026-10-04", shiftTemplateId: "aksam" },
        { employeeId: "e1", date: "2026-10-05", shiftTemplateId: "sabah" },
      ],
      weekDates,
      previousDate: "2026-10-04",
    });
    const issue = result.issues.find((i) => i.type === "dinlenme");
    expect(issue?.date).toBe("2026-10-05");
    // 10-04 hafta dışı olduğu için haftalık saate sayılmaz
    expect(result.perEmployee.get("e1")?.weeklyHours).toBe(8);
  });

  it("aynı gün birden fazla vardiyayı çakışma olarak işaretler", () => {
    const result = analyzeWeek({
      employees: [employees[0]],
      shifts,
      assignments: [
        { employeeId: "e1", date: "2026-10-05", shiftTemplateId: "sabah" },
        { employeeId: "e1", date: "2026-10-05", shiftTemplateId: "aksam" },
      ],
      weekDates,
    });
    const issue = result.issues.find((i) => i.type === "cift_vardiya");
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe("error");
    expect(result.perEmployee.get("e1")?.weeklyHours).toBe(16);
  });

  it("45 saat üstünü fazla mesai olarak hesaplar", () => {
    const assignments = weekDates.slice(0, 6).map((date) => ({
      employeeId: "e1",
      date,
      shiftTemplateId: "sabah",
    }));
    const result = analyzeWeek({ employees: [employees[0]], shifts, assignments, weekDates });
    expect(result.perEmployee.get("e1")?.weeklyHours).toBe(48);
    expect(result.perEmployee.get("e1")?.overtimeHours).toBe(3);
    expect(result.totalOvertimeHours).toBe(3);
    expect(result.issues.some((i) => i.type === "fazla_mesai")).toBe(true);
  });

  it("birden fazla personeli ayrı ayrı değerlendirir", () => {
    const result = analyzeWeek({
      employees,
      shifts,
      assignments: [
        { employeeId: "e1", date: "2026-10-05", shiftTemplateId: "sabah" },
        { employeeId: "e2", date: "2026-10-05", shiftTemplateId: "aksam" },
        { employeeId: "e2", date: "2026-10-06", shiftTemplateId: "sabah" },
      ],
      weekDates,
    });
    expect(result.perEmployee.get("e1")?.weeklyHours).toBe(8);
    expect(result.perEmployee.get("e1")?.issues).toHaveLength(0);
    expect(result.issues.some((i) => i.employeeId === "e2" && i.type === "dinlenme")).toBe(true);
  });

  it("sabitler mevzuata uygun", () => {
    expect(MIN_DAILY_REST_HOURS).toBe(11);
    expect(OVERTIME_MULTIPLIER).toBe(1.5);
  });

  it("gece vardiyası 7,5 saati aşınca uyarır", () => {
    const nightShifts = [...shifts, { id: "gece", name: "Gece", start: "20:00", end: "08:00" }];
    const result = analyzeWeek({
      employees: [employees[0]],
      shifts: nightShifts,
      assignments: [{ employeeId: "e1", date: "2026-10-05", shiftTemplateId: "gece" }],
      weekDates,
    });
    expect(result.issues.some((i) => i.type === "gece")).toBe(true);
  });

  it("resmî tatilde çalışmayı işaretler", () => {
    const holidayWeek = [
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29", // Cumhuriyet Bayramı
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ];
    const result = analyzeWeek({
      employees: [employees[0]],
      shifts,
      assignments: [{ employeeId: "e1", date: "2026-10-29", shiftTemplateId: "sabah" }],
      weekDates: holidayWeek,
    });
    expect(result.issues.some((i) => i.type === "tatil")).toBe(true);
  });
});

describe("nightHours", () => {
  it("gündüz 09:00–17:00 → 0 saat", () => {
    expect(nightHours({ start: "09:00", end: "17:00" })).toBe(0);
  });
  it("akşam 17:00–01:00 → 5 saat", () => {
    expect(nightHours({ start: "17:00", end: "01:00" })).toBe(5);
  });
  it("20:00–08:00 → 10 saat; sınır 7,5", () => {
    expect(nightHours({ start: "20:00", end: "08:00" })).toBe(10);
    expect(NIGHT_LIMIT_HOURS).toBe(7.5);
  });
});
