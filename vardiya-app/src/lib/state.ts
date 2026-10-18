import { prisma } from "./prisma";
import { ensureBusiness } from "./server-data";
import type { ColorKey, StatePayload } from "./types";

/**
 * Tüm uygulama durumunu (işletme, personel, şablonlar, atamalar, duyurular,
 * gün notları) tek yerde toplar.
 *
 * Neden ayrı dosya: Aynı veri hem `/api/state` ucundan (istemci tazelemesi)
 * hem de sunucu bileşenlerinden (sayfa ilk açılışı) gerekiyor. Böylece sayfalar
 * "Yükleniyor..." beklemeden, veriyle birlikte açılır — site daha akıcı olur.
 */
export async function getStatePayload(): Promise<StatePayload> {
  const business = await ensureBusiness();

  const [employees, shiftTemplates, assignments, announcements, dayNotes] =
    await Promise.all([
      prisma.employee.findMany({
        where: { businessId: business.id, active: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.shiftTemplate.findMany({ where: { businessId: business.id } }),
      prisma.assignment.findMany({ where: { businessId: business.id } }),
      prisma.announcement.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.dayNote.findMany({ where: { businessId: business.id } }),
    ]);

  return {
    business: { id: business.id, name: business.name },
    employees: employees.map((e) => ({
      id: e.id,
      name: e.name,
      phone: e.phone,
      role: e.role,
      color: e.color as ColorKey,
      hourlyWage: e.hourlyWage,
      annualLeaveDays: e.annualLeaveDays,
    })),
    shiftTemplates: shiftTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      start: t.start,
      end: t.end,
      color: t.color as ColorKey,
      minStaff: t.minStaff,
    })),
    assignments: assignments.map((a) => ({
      employeeId: a.employeeId,
      date: a.date,
      shiftTemplateId: a.shiftTemplateId,
    })),
    announcements: announcements.map((a) => ({
      id: a.id,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
    })),
    dayNotes: dayNotes.map((d) => ({ date: d.date, note: d.note })),
  };
}
