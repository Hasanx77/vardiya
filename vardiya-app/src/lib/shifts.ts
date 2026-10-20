import type { ShiftTemplate } from "./types";

/** Varsayılan vardiya şablonları (HORECA dostu) */
export const DEFAULT_SHIFTS: ShiftTemplate[] = [
  { id: "sabah", name: "Sabah", start: "09:00", end: "17:00", color: "amber", minStaff: 0 },
  { id: "aksam", name: "Akşam", start: "17:00", end: "01:00", color: "violet", minStaff: 0 },
  { id: "tamgun", name: "Tam Gün", start: "10:00", end: "22:00", color: "rose", minStaff: 0 },
  { id: "ara", name: "Ara Vardiya", start: "12:00", end: "20:00", color: "cyan", minStaff: 0 },
];

/** Bir vardiyanın saat cinsinden süresi (gece yarısını aşanlar dahil) */
export function shiftHours(shift: { start: string; end: string }): number {
  const [sh, sm] = shift.start.split(":").map(Number);
  const [eh, em] = shift.end.split(":").map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60; // gece yarısını aşan vardiya
  return minutes / 60;
}

/** Haftalık yasal sınır (İş Kanunu: haftalık 45 saat) */
export const WEEKLY_LIMIT_HOURS = 45;

/* ============================================================
   STANDART MESAİ SAATLERİ
   İşletmenin açılış/kapanış saatleri "standart"tır; vardiya
   şablonları bu saatlerden türetilir. Böylece kullanıcı saatleri
   her şablonda tek tek yazmak zorunda kalmaz.
   ============================================================ */

/** "09:30" → 570 (gün başından dakika) */
export function saatDakika(saat: string): number {
  const [s, d] = (saat || "").split(":").map(Number);
  if (!Number.isFinite(s) || !Number.isFinite(d)) return 0;
  return ((s % 24) + 24) % 24 * 60 + (((d % 60) + 60) % 60);
}

/** 570 → "09:30" */
export function dakikaSaat(dakika: number): string {
  const m = ((Math.round(dakika) % 1440) + 1440) % 1440;
  const s = Math.floor(m / 60);
  const d = m % 60;
  return `${String(s).padStart(2, "0")}:${String(d).padStart(2, "0")}`;
}

const yuvarla15 = (m: number) => Math.round(m / 15) * 15;

/**
 * Standart açılış/kapanıştan 4 vardiya şablonu üretir:
 * Sabah (açılış → orta), Akşam (orta → kapanış), Tam Gün, Ara Vardiya.
 */
export function standartSablonlar(acilis: string, kapanis: string) {
  const A = saatDakika(acilis);
  const K = saatDakika(kapanis);
  const sure = ((K - A + 1440) % 1440) || 840; // gece yarısını aşan günler dahil

  // Çok kısa mesai saatlerinde (ör. 09:00–11:00) "orta" ve "ara vardiya"
  // saatleri taşıp ertesi güne sarkmasın: en az 15 dakika pay bırak.
  const yari = Math.floor(sure / 2);
  const ortaPay = Math.min(Math.max(15, yuvarla15(yari)), Math.max(15, sure - 15));
  const orta = A + ortaPay;

  // Ara vardiya, tam günün ortasından en fazla 2'şer saat içeride başlar/biter.
  const araPay = Math.max(0, Math.min(120, Math.floor(sure / 4)));

  return [
    { name: "Sabah", start: dakikaSaat(A), end: dakikaSaat(orta), color: "amber", minStaff: 0 },
    { name: "Akşam", start: dakikaSaat(orta), end: dakikaSaat(K), color: "violet", minStaff: 0 },
    { name: "Tam Gün", start: dakikaSaat(A), end: dakikaSaat(K), color: "rose", minStaff: 0 },
    {
      name: "Ara Vardiya",
      start: dakikaSaat(A + araPay),
      end: dakikaSaat(K - araPay),
      color: "cyan",
      minStaff: 0,
    },
  ];
}

export function shiftLabel(shift: ShiftTemplate): string {
  return `${shift.name} (${shift.start}–${shift.end})`;
}
