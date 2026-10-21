import { prisma } from "./prisma";
import { DEFAULT_SHIFTS } from "./shifts";
import { gunEkleISO, haftaBasiISO } from "./dates";
import { aktifKullaniciId } from "./auth";

/**
 * Örnek personel + örnek haftalık plan oluşturur (paneldeki "demo yükle" için).
 * Şablon kimlikleri artık üretildiği için isimden bulunur.
 */
export async function seedDemoData(businessId: string) {
  let sablonlar = await prisma.shiftTemplate.findMany({ where: { businessId } });

  // Demo için gereken çekirdek şablonlar silinmiş/yeniden adlandırılmışsa
  // sessizce boş plan oluşmasın: eksikleri varsayılandan tamamla.
  const gerekliAdlar = ["Sabah", "Akşam", "Tam Gün"];
  const eksik = DEFAULT_SHIFTS.filter(
    (s) =>
      gerekliAdlar.includes(s.name) &&
      !sablonlar.some((mevcut) => mevcut.name.startsWith(s.name))
  );
  if (eksik.length > 0) {
    await prisma.shiftTemplate.createMany({
      data: eksik.map((s) => ({
        businessId,
        name: s.name,
        start: s.start,
        end: s.end,
        color: s.color,
        minStaff: s.minStaff,
      })),
    });
    sablonlar = await prisma.shiftTemplate.findMany({ where: { businessId } });
  }

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

  // Hafta, Türkiye saatine göre hesaplanır (sunucu UTC olsa bile doğru gün).
  const pazartesi = haftaBasiISO();
  const iso = (n: number) => gunEkleISO(pazartesi, n);

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
 *
 * Kenar durumlar (düzeltildi):
 * - Çerez imzası geçerli ama kullanıcı silinmişse eskiden foreign-key hatası
 *   ile 500 dönüyordu. Artık "OTURUM_YOK" hatası veriyor.
 * - Aynı kullanıcı için eşzamanlı iki istek işletme oluşturmaya çalışırsa
 *   (userId tekil) biri patlıyordu; artık yarış güvenli.
 */
export async function ensureBusiness() {
  const userId = await aktifKullaniciId();
  if (!userId) throw new Error("OTURUM_YOK");

  const kullanici = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!kullanici) throw new Error("OTURUM_YOK");

  const mevcut = await prisma.business.findUnique({ where: { userId } });
  if (mevcut) return mevcut;

  try {
    // Yeni hesap: boş işletme + varsayılan vardiya şablonları (tek işlemde)
    return await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: { userId, name: "İşletmem" },
      });

      await tx.shiftTemplate.createMany({
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
    });
  } catch (e) {
    // Eşzamanlı istek araya girdiyse oluşturulan işletmeyi kullan.
    if ((e as { code?: string })?.code === "P2002") {
      const olusan = await prisma.business.findUnique({ where: { userId } });
      if (olusan) return olusan;
    }
    throw e;
  }
}
