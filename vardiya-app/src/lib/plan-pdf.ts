/**
 * Haftalık planı PDF'e çeviren veri hattı.
 *
 * Panel, e-posta eki ve (ileride) personel bağlantısı aynı PDF'i kullanır;
 * böylece ekranda görünen ile gönderilen belge birbirini tutar.
 */
import { prisma } from "./prisma";
import { analyzeWeek } from "./compliance";
import { shiftHours, shiftSaatMetni } from "./shifts";
import { DAY_SHORT_TR } from "./dates";
import { planPdf, type PdfGirdi, type PdfSatir } from "./pdf";

/** ISO (YYYY-MM-DD) → o günün yerel öğlen vakti (saat dilimi kaymasın). */
function tarih(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

function isoEkle(iso: string, gun: number): string {
  const d = tarih(iso);
  d.setDate(d.getDate() + gun);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const g = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${g}`;
}

const AY_KISA = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

export function haftaEtiketi(haftaBasi: string): string {
  const bas = tarih(haftaBasi);
  const son = tarih(isoEkle(haftaBasi, 6));
  const basMetin = `${bas.getDate()} ${AY_KISA[bas.getMonth()]}`;
  const sonMetin = `${son.getDate()} ${AY_KISA[son.getMonth()]} ${son.getFullYear()}`;
  return `${basMetin} – ${sonMetin}`;
}

export function pdfDosyaAdi(haftaBasi: string): string {
  return `vardiya-plani-${haftaBasi}.pdf`;
}

export type PlanPdfSonuc = {
  pdf: Uint8Array;
  dosyaAdi: string;
  hafta: string;
  ozet: string;
  uyariSayisi: number;
};

/** Bir işletmenin bir haftası → PDF + kısa özet (e-posta metni için). */
export async function planPdfUret(
  businessId: string,
  haftaBasi: string,
): Promise<PlanPdfSonuc> {
  const gunler = Array.from({ length: 7 }, (_, i) => isoEkle(haftaBasi, i));
  // Hafta başından bir önceki gün: 11 saat dinlenme kuralı iki gün arasında
  // kontrol edilir, bu yüzden önceki günün ataması da çekilmeli.
  const oncekiGun = isoEkle(haftaBasi, -1);

  const [isletme, personel, sablonlar, atamalar] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId }, select: { name: true } }),
    prisma.employee.findMany({
      where: { businessId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
    prisma.shiftTemplate.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        start: true,
        end: true,
        breakStart: true,
        breakEnd: true,
        color: true,
        minStaff: true,
      },
    }),
    prisma.assignment.findMany({
      where: { businessId, date: { in: [oncekiGun, ...gunler] } },
      select: { employeeId: true, shiftTemplateId: true, date: true },
    }),
  ]);

  const sablonHarita = new Map(sablonlar.map((s) => [s.id, s]));
  const atamaHarita = new Map(atamalar.map((a) => [`${a.employeeId}|${a.date}`, a]));

  let toplamVardiya = 0;
  let toplamSaat = 0;

  const satirlar: PdfSatir[] = personel.map((kisi) => {
    let kisiSaat = 0;

    const gunlerHucre = gunler.map((gun) => {
      const atama = atamaHarita.get(`${kisi.id}|${gun}`);
      if (!atama) return "";
      const sablon = sablonHarita.get(atama.shiftTemplateId);
      if (!sablon) return "";
      const saat = shiftHours(sablon);
      toplamVardiya += 1;
      toplamSaat += saat;
      kisiSaat += saat;
      return `${sablon.name} ${shiftSaatMetni(sablon)}`;
    });

    return {
      ad: kisi.name,
      rol: kisi.role,
      gunler: gunlerHucre,
      toplamSaat: Math.round(kisiSaat * 10) / 10,
    };
  });

  const analiz = analyzeWeek({
    employees: personel.map((p) => ({ id: p.id, name: p.name })),
    shifts: sablonlar,
    assignments: atamalar,
    weekDates: gunler,
    previousDate: oncekiGun,
  });

  const calisanSayisi = satirlar.filter((s) => s.toplamSaat > 0).length;

  const girdi: PdfGirdi = {
    isletme: isletme?.name ?? "İşletme",
    hafta: haftaEtiketi(haftaBasi),
    gunBasliklari: gunler.map((g, i) => {
      const d = tarih(g);
      return `${DAY_SHORT_TR[i]} ${d.getDate()}`;
    }),
    satirlar,
    ozet: [
      `${toplamVardiya} vardiya`,
      `${Math.round(toplamSaat * 10) / 10} saat`,
      `${calisanSayisi}/${personel.length} kişi`,
      ...(analiz.issues.length ? [`${analiz.issues.length} uyarı`] : ["uyarı yok"]),
    ],
    uyarilar: analiz.issues.slice(0, 6).map((i) => `${i.message} (${i.date.slice(5)})`),
    olusturma: new Date().toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Istanbul",
    }),
  };

  const pdf = await planPdf(girdi);

  return {
    pdf,
    dosyaAdi: pdfDosyaAdi(haftaBasi),
    hafta: girdi.hafta,
    ozet: `${toplamVardiya} vardiya · ${Math.round(toplamSaat * 10) / 10} saat · ${calisanSayisi}/${personel.length} kişi${analiz.issues.length ? ` · ${analiz.issues.length} uyarı` : ""}`,
    uyariSayisi: analiz.issues.length,
  };
}
