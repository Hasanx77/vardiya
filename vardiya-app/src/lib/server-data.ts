import { prisma } from "./prisma";
import { DEFAULT_SHIFTS } from "./shifts";
import { addDays, startOfWeek, toISODate } from "./dates";
import { aktifKullaniciId } from "./auth";

/**
 * Örnek personel + örnek haftalık plan oluşturur (paneldeki "demo yükle" için).
 * Şablon kimlikleri artık üretildiği için isimden bulunur.
 */
export async function seedDemoData(businessId: string) {
  const sablonlar = await prisma.shiftTemplate.findMany({ where: { businessId } });
  const bul = (ad: string) => sablonlar.find((s) => s.name.startsWith(ad))?.id;
  const sabah = bul("Sabah");
  const aksam = bul("Akşam");
  const tamgun = bul("Tam Gün");
  if (!sabah || !aksam || !tamgun) return; // şablonlar yoksa demo kurulamaz

  const employees = [
    { name: "Ayşe Yılmaz", phone: "0532 111 22 33", role: "Barista", color: "sky" },
    { name: "Mehmet Kaya", phone: "0533 222 33 44", role: "Garson", color: "emerald" },
    { name: "Zeynep Demir", phone: "0534 333 44 55", role: "Şef", color: "amber" },
    { name: "Can Arslan", phone: "0535 444 55 66", role: "Garson", color: "violet" },
  ];

  for (const e of employees) {
    await prisma.employee.create({ data: { businessId, ...e } });
  }

  const kayitli = await prisma.employee.findMany({
    where: { businessId },
    orderBy: { createdAt: "asc" },
  });

  const pazartesi = startOfWeek(new Date());
  const iso = (n: number) => toISODate(addDays(pazartesi, n));

  const plan: { e: number; d: number; s: string }[] = [
    { e: 0, d: 0, s: sabah },
    { e: 0, d: 1, s: sabah },
    { e: 0, d: 3, s: sabah },
    { e: 1, d: 0, s: aksam },
    { e: 1, d: 1, s: aksam },
    { e: 1, d: 2, s: aksam },
    { e: 2, d: 2, s: tamgun },
    { e: 2, d: 4, s: sabah },
    { e: 3, d: 4, s: aksam },
    { e: 3, d: 5, s: aksam },
  ];

  await prisma.assignment.createMany({
    data: plan
      .filter((r) => kayitli[r.e])
      .map((r) => ({
        businessId,
        employeeId: kayitli[r.e].id,
        date: iso(r.d),
        shiftTemplateId: r.s,
      })),
  });
}

/**
 * Oturumdaki kullanıcının işletmesini döner; ilk kez geliyorsa oluşturur.
 *
 * 🔒 Gizlilik/izolasyon: her sorgu **kullanıcıya bağlı işletme** üzerinden yapılır,
 * böylece bir kullanıcı başkasının personelini/vardiyasını göremez.
 * Oturum yoksa hata verir (middleware zaten oturumsuz isteği geçirmez).
 */
export async function ensureBusiness() {
  const userId = await aktifKullaniciId();
  if (!userId) throw new Error("OTURUM_YOK");

  const mevcut = await prisma.business.findUnique({ where: { userId } });
  if (mevcut) return mevcut;

  // Yeni hesap: boş işletme + varsayılan vardiya şablonları
  const business = await prisma.business.create({
    data: { userId, name: "İşletmem" },
  });

  await prisma.shiftTemplate.createMany({
    data: DEFAULT_SHIFTS.map((s) => ({
      businessId: business.id,
      name: s.name,
      start: s.start,
      end: s.end,
      color: s.color,
      minStaff: s.minStaff,
    })),
  });

  return business;
}
