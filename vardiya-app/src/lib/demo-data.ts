import { analyzeWeek } from "./compliance";
import { COLOR_CLASSES } from "./colors";
import { DEFAULT_SHIFTS } from "./shifts";
import type { Employee } from "./types";

/**
 * Tanıtım sayfasındaki mini çizelge ile /demo ekranının **tek veri kaynağı**.
 *
 * Neden ayrı: İkisi ayrı yerde elle yazıldığında sayılar birbirini tutmuyordu
 * (vitrinde "4 personel / 15 vardiya", demoda "5 personel / 19 vardiya" gibi).
 * Artık ikisi de bu dosyadan üretiliyor; sayı uyuşmazlığı yapısal olarak imkânsız.
 */

export const DEMO_ISLETME = "Kahve Durağı";

export const DEMO_GUNLER = [
  { iso: "2026-10-19", ad: "Pzt", tarih: "19 Eki" },
  { iso: "2026-10-20", ad: "Sal", tarih: "20 Eki" },
  { iso: "2026-10-21", ad: "Çar", tarih: "21 Eki" },
  { iso: "2026-10-22", ad: "Per", tarih: "22 Eki" },
  { iso: "2026-10-23", ad: "Cum", tarih: "23 Eki" },
  { iso: "2026-10-24", ad: "Cmt", tarih: "24 Eki" },
  { iso: "2026-10-25", ad: "Paz", tarih: "25 Eki" },
];

export const DEMO_PERSONEL: Employee[] = [
  { id: "p1", name: "Ayşe Yılmaz", role: "Barista", phone: "", color: "amber", annualLeaveDays: 14 },
  { id: "p2", name: "Mehmet Kaya", role: "Garson", phone: "", color: "emerald", annualLeaveDays: 14 },
  { id: "p3", name: "Zeynep Demir", role: "Şef", phone: "", color: "rose", annualLeaveDays: 14 },
  { id: "p4", name: "Can Aydın", role: "Barista", phone: "", color: "violet", annualLeaveDays: 14 },
  { id: "p5", name: "Elif Şahin", role: "Servis", phone: "", color: "cyan", annualLeaveDays: 14 },
];

/** Hücreye tıklanınca dönen vardiya sırası (demo etkileşimi). */
export const DEMO_SIRA = ["sabah", "aksam", "tamgun", "ara"] as const;

export function demoKey(employeeId: string, iso: string) {
  return `${employeeId}__${iso}`;
}

/** Demodaki başlangıç planı. Kasıtlı olarak bir dinlenme uyarısı içerir. */
export function demoAtamalari(): Record<string, string> {
  const atama: Record<string, string> = {};
  const ekle = (employeeId: string, gunler: string[], vardiya: string) => {
    for (const iso of gunler) atama[demoKey(employeeId, iso)] = vardiya;
  };

  ekle("p1", ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-23"], "sabah");
  ekle("p2", ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-23", "2026-10-24", "2026-10-25"], "aksam");
  ekle("p3", ["2026-10-21", "2026-10-24", "2026-10-25"], "tamgun");
  ekle("p4", ["2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"], "ara");
  // Kasıtlı örnek: akşam kapanışından sonra ertesi sabah açılış → 8 saat dinlenme.
  ekle("p5", ["2026-10-22"], "aksam");
  ekle("p5", ["2026-10-23"], "sabah");

  return atama;
}

export function demoAtamaSatirlari(atama: Record<string, string>) {
  return Object.entries(atama).map(([k, shiftTemplateId]) => {
    const [employeeId, date] = k.split("__");
    return { employeeId, date, shiftTemplateId };
  });
}

export type DemoSatir = {
  id: string;
  /** Vitrin için kısaltılmış ad: "Ayşe Y." */
  ad: string;
  /** Personel renginin nokta sınıfı */
  renk: string;
  /** Günlere karşılık gelen hücreler (sıra: DEMO_GUNLER) */
  hucreler: { etiket: string | null; tur: string | null }[];
};

export type DemoOzet = {
  isletme: string;
  gunler: string[];
  satirlar: DemoSatir[];
  kisi: number;
  calisan: number;
  toplamVardiya: number;
  toplamSaat: number;
  uyari: number;
};

function kisaAd(ad: string): string {
  const [ilk, ...kalan] = ad.trim().split(/\s+/);
  if (!kalan.length) return ilk;
  return `${ilk} ${kalan[kalan.length - 1][0]}.`;
}

/** Vitrin ve demo için ortak özet (sayılar her zaman aynı kaynaktan). */
export function demoOzet(): DemoOzet {
  const atama = demoAtamalari();
  const satirlar = demoAtamaSatirlari(atama);
  const analiz = analyzeWeek({
    employees: DEMO_PERSONEL,
    shifts: DEFAULT_SHIFTS,
    assignments: satirlar,
    weekDates: DEMO_GUNLER.map((g) => g.iso),
  });

  const shiftName = new Map(DEFAULT_SHIFTS.map((s) => [s.id, s.name]));

  return {
    isletme: DEMO_ISLETME,
    gunler: DEMO_GUNLER.map((g) => g.ad),
    satirlar: DEMO_PERSONEL.map((p) => ({
      id: p.id,
      ad: kisaAd(p.name),
      renk: COLOR_CLASSES[p.color]?.dot ?? "bg-zinc-400",
      hucreler: DEMO_GUNLER.map((g) => {
        const tur = atama[demoKey(p.id, g.iso)] ?? null;
        return { etiket: tur ? shiftName.get(tur) ?? tur : null, tur };
      }),
    })),
    kisi: DEMO_PERSONEL.length,
    calisan: DEMO_PERSONEL.filter(
      (p) => (analiz.perEmployee.get(p.id)?.weeklyHours ?? 0) > 0
    ).length,
    toplamVardiya: satirlar.length,
    toplamSaat: [...analiz.perEmployee.values()].reduce((s, e) => s + e.weeklyHours, 0),
    uyari: analiz.issues.length,
  };
}
