import { prisma } from "./prisma";
import { DEFAULT_SHIFTS } from "./shifts";
import { addDays, startOfWeek, toISODate } from "./dates";

/** Örnek personel + örnek haftalık plan oluşturur (demo için) */
export async function seedDemoData(businessId: string) {
  const employees = [
    { name: "Ayşe Yılmaz", phone: "0532 111 22 33", role: "Barista", color: "sky" },
    { name: "Mehmet Kaya", phone: "0533 222 33 44", role: "Garson", color: "emerald" },
    { name: "Zeynep Demir", phone: "0534 333 44 55", role: "Şef", color: "amber" },
    { name: "Can Arslan", phone: "0535 444 55 66", role: "Garson", color: "violet" },
  ];

  for (const e of employees) {
    await prisma.employee.create({ data: { businessId, ...e } });
  }

  const saved = await prisma.employee.findMany({
    where: { businessId },
    orderBy: { createdAt: "asc" },
  });

  const monday = startOfWeek(new Date());
  const iso = (n: number) => toISODate(addDays(monday, n));

  const plan: { e: number; d: number; s: string }[] = [
    { e: 0, d: 0, s: "sabah" },
    { e: 0, d: 1, s: "sabah" },
    { e: 0, d: 3, s: "sabah" },
    { e: 1, d: 0, s: "aksam" },
    { e: 1, d: 1, s: "aksam" },
    { e: 1, d: 2, s: "aksam" },
    { e: 2, d: 2, s: "tamgun" },
    { e: 2, d: 4, s: "sabah" },
    { e: 3, d: 4, s: "aksam" },
    { e: 3, d: 5, s: "aksam" },
  ];

  await prisma.assignment.createMany({
    data: plan.map((r) => ({
      businessId,
      employeeId: saved[r.e].id,
      date: iso(r.d),
      shiftTemplateId: r.s,
    })),
  });
}

/** İlk çalıştırmada işletme + şablonlar + demo veriyi oluşturur */
export async function ensureBusiness() {
  const existing = await prisma.business.findFirst();
  if (existing) return existing;

  const business = await prisma.business.create({
    data: { name: "Örnek Kafe" },
  });

  await prisma.shiftTemplate.createMany({
    data: DEFAULT_SHIFTS.map((s) => ({
      id: s.id,
      businessId: business.id,
      name: s.name,
      start: s.start,
      end: s.end,
      color: s.color,
    })),
  });

  await seedDemoData(business.id);
  return business;
}
