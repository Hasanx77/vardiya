import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * PDF tutarlılık testi — hafta başından önceki günün dinlenme kontrolü.
 *
 * Panelde `analyzeWeek` önceki günü de görüyor (state tüm atamaları getiriyor),
 * fakat PDF üretimi yalnız o haftanın atamalarını çekiyordu. `previousDate`
 * verilse de o güne ait atama bulunmadığı için 11 saat dinlenme uyarısı PDF'e
 * hiç girmiyordu. Ekran ile belge çelişiyordu.
 *
 * Senaryo: Pazar 17:00–01:00 (Akşam) → Pazartesi 09:00–17:00 (Sabah)
 * = 8 saat dinlenme → tek uyarı (dinlenme) olmalı.
 */

const takip = vi.hoisted(() => ({
  business: vi.fn(),
  employees: vi.fn(),
  templates: vi.fn(),
  assignments: vi.fn(),
}));

vi.mock("./prisma", () => ({
  prisma: {
    business: { findUnique: takip.business },
    employee: { findMany: takip.employees },
    shiftTemplate: { findMany: takip.templates },
    assignment: { findMany: takip.assignments },
  },
}));

import { planPdfUret } from "./plan-pdf";

const SABLONLAR = [
  { id: "sabah", name: "Sabah", start: "09:00", end: "17:00", breakStart: null, breakEnd: null, color: "amber", minStaff: 0 },
  { id: "aksam", name: "Akşam", start: "17:00", end: "01:00", breakStart: null, breakEnd: null, color: "violet", minStaff: 0 },
];

const ATAMALAR = [
  { employeeId: "e1", shiftTemplateId: "aksam", date: "2026-10-04" }, // önceki Pazar
  { employeeId: "e1", shiftTemplateId: "sabah", date: "2026-10-05" }, // Pazartesi
];

beforeEach(() => {
  vi.clearAllMocks();
  takip.business.mockResolvedValue({ name: "Örnek Kafe" });
  takip.employees.mockResolvedValue([{ id: "e1", name: "Ayşe", role: "Barista" }]);
  takip.templates.mockResolvedValue(SABLONLAR);
  // Veritabanı gibi davran: yalnız istenen tarihleri döndür.
  takip.assignments.mockImplementation(
    async (args: { where?: { date?: { in?: string[] } } }) => {
      const istenen = args?.where?.date?.in ?? [];
      return ATAMALAR.filter((a) => istenen.includes(a.date));
    },
  );
});

describe("planPdfUret — hafta başı dinlenme", () => {
  it("önceki günün atamasını da sorgular", async () => {
    await planPdfUret("b1", "2026-10-05");
    const istenen = (takip.assignments.mock.calls[0][0] as { where: { date: { in: string[] } } })
      .where.date.in;
    expect(istenen).toContain("2026-10-04");
    expect(istenen).toContain("2026-10-05");
  });

  it("8 saatlik dinlenmeyi uyarı olarak rapora koyar", async () => {
    const sonuc = await planPdfUret("b1", "2026-10-05");
    expect(sonuc.uyariSayisi).toBe(1);
    expect(sonuc.ozet).toContain("uyarı");
  });

  it("hafta dışı atama haftalık saate eklenmez", async () => {
    const sonuc = await planPdfUret("b1", "2026-10-05");
    // Yalnız Pazartesi 8 saat sayılır (Pazar günü haftaya dahil değil).
    expect(sonuc.ozet).toContain("8 saat");
  });
});
