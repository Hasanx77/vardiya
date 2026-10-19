import { prisma } from "./prisma";
import type { ColorKey, ShiftTemplate } from "./types";

/**
 * Personelin **herkese açık** (salt-okunur) program verisi.
 *
 * Neden ayrı: `/ekip/<id>` bağlantısı personelle paylaşılır ve giriş
 * gerektirmez. Bu yüzden burada yalnızca o kişinin görmesi gereken alanlar
 * döner — telefon, diğer personel, işletme ayarları **asla** yer almaz.
 */
export type EkipPayload = {
  businessName: string;
  employee: {
    id: string;
    name: string;
    role: string;
    color: ColorKey;
    annualLeaveDays: number;
  };
  shiftTemplates: ShiftTemplate[];
  assignments: { date: string; shiftTemplateId: string }[];
  announcements: { id: string; message: string; createdAt: string }[];
};

export async function getEkipPayload(id: string): Promise<EkipPayload | null> {
  if (!id || id.length > 64) return null;

  const employee = await prisma.employee.findFirst({
    where: { id, active: true },
    include: { business: true },
  });
  if (!employee) return null;

  const [shiftTemplates, assignments, announcements] = await Promise.all([
    prisma.shiftTemplate.findMany({
      where: { businessId: employee.businessId },
    }),
    prisma.assignment.findMany({
      where: { employeeId: employee.id },
      orderBy: { date: "asc" },
    }),
    prisma.announcement.findMany({
      where: { businessId: employee.businessId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    businessName: employee.business.name,
    employee: {
      id: employee.id,
      name: employee.name,
      role: employee.role,
      color: employee.color as ColorKey,
      annualLeaveDays: employee.annualLeaveDays,
    },
    shiftTemplates: shiftTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      start: t.start,
      end: t.end,
      color: t.color as ColorKey,
      minStaff: t.minStaff,
    })),
    assignments: assignments.map((a) => ({
      date: a.date,
      shiftTemplateId: a.shiftTemplateId,
    })),
    announcements: announcements.map((a) => ({
      id: a.id,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}
