import { describe, it, expect } from "vitest";
import { buildScheduleText, buildWhatsAppLink, normalizePhone } from "./whatsapp";
import type { Employee, ShiftTemplate } from "./types";

describe("normalizePhone", () => {
  it("0 ile başlayanı 90 yapar", () => {
    expect(normalizePhone("0532 111 22 33")).toBe("905321112233");
  });
  it("boşluksuz 10 haneyi 90 yapar", () => {
    expect(normalizePhone("5321112233")).toBe("905321112233");
  });
  it("zaten 90'lıysa dokunmaz", () => {
    expect(normalizePhone("905321112233")).toBe("905321112233");
  });
  it("boş girdi boş döner", () => {
    expect(normalizePhone("")).toBe("");
  });
});

describe("buildWhatsAppLink", () => {
  it("doğru wa.me adresi ve kodlanmış mesaj üretir", () => {
    const link = buildWhatsAppLink("0532 111 22 33", "Merhaba Dünya");
    expect(link).toContain("https://wa.me/905321112233");
    expect(link).toContain("Merhaba%20D%C3%BCnya");
  });
});

describe("buildScheduleText", () => {
  const emp: Employee = {
    id: "e1",
    name: "Ayşe",
    phone: "05321112233",
    role: "Barista",
    color: "sky",
    hourlyWage: 100,
    annualLeaveDays: 14,
  };
  const templates: ShiftTemplate[] = [
    { id: "sabah", name: "Sabah", start: "09:00", end: "17:00", color: "amber", minStaff: 0 },
  ];
  const week = [new Date(2026, 9, 5)]; // tek gün (Pazartesi)
  const assignments = { "e1__2026-10-05": "sabah" };

  it("personel adını ve vardiyayı içerir", () => {
    const text = buildScheduleText(emp, week, assignments, templates, "Örnek Kafe");
    expect(text).toContain("Ayşe");
    expect(text).toContain("Sabah");
    expect(text).toContain("09:00");
  });

  it("vardiya yoksa bilgilendirir", () => {
    const text = buildScheduleText(emp, week, {}, templates, "Örnek Kafe");
    expect(text).toContain("atanmış vardiyan yok");
  });
});
