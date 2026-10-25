import { prisma } from "./prisma";
import { tokenCoz } from "./employee-link";
import { yayindakiKayitlar } from "./yayin";
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
  /** Bağlantının kendisi — takvim (.ics) indirmesi de bu token'ı kullanır. */
  token: string;
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
  /**
   * Yayınlanmamış (taslak) haftalarda vardiya var mı?
   * Varsa personel ekranında "yeni plan henüz yayınlanmadı" notu gösterilir —
   * taslağın *içeriği* asla gönderilmez.
   */
  taslakHaftaVar: boolean;
};

/**
 * `token` — `/ekip/<token>` adresindeki imzalı belirteç.
 * Belirteç geçersizse (yenilenmiş veya kapatılmış) null döner; böylece
 * işveren "linki kapat" dediğinde eski bağlantı gerçekten çalışmaz.
 */
export async function getEkipPayload(token: string): Promise<EkipPayload | null> {
  if (!token || token.length > 120) return null;

  const employeeId = await tokenCoz(token);
  if (!employeeId) return null;

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, active: true },
    include: { business: true },
  });
  if (!employee) return null;

  const [shiftTemplates, assignments, announcements, weekPlans] = await Promise.all([
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
    prisma.weekPlan.findMany({
      where: { businessId: employee.businessId },
      select: { weekStart: true },
    }),
  ]);

  // 🔒 Yalnızca yayınlanmış haftalar ekibe görünür; taslak haftalar sızmaz.
  const yayinliHaftalar = weekPlans.map((w) => w.weekStart);
  const yayindaki = yayindakiKayitlar(assignments, yayinliHaftalar);

  return {
    businessName: employee.business.name,
    token,
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
      breakStart: t.breakStart,
      breakEnd: t.breakEnd,
      color: t.color as ColorKey,
      minStaff: t.minStaff,
    })),
    assignments: yayindaki.map((a) => ({
      date: a.date,
      shiftTemplateId: a.shiftTemplateId,
    })),
    announcements: announcements.map((a) => ({
      id: a.id,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
    })),
    taslakHaftaVar: assignments.length > yayindaki.length,
  };
}
