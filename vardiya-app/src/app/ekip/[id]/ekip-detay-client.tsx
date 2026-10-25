"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { EkipPayload } from "@/lib/ekip";
import { DAY_NAMES_TR, formatShort, formatWeekRange, getWeekDates, toISODate } from "@/lib/dates";
import { shiftHours, shiftSaatMetni, WEEKLY_LIMIT_HOURS } from "@/lib/shifts";
import { COLOR_CLASSES } from "@/lib/colors";
import { getHoliday } from "@/lib/holidays";

/**
 * Personelin kendi programı — yalnızca görüntüleme.
 * Veri sunucudan hazır gelir; bu bileşen yalnızca hafta gezinmesi yapar.
 */
export default function EkipDetayClient({ veri }: { veri: EkipPayload }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const shiftById = useMemo(() => {
    const m = new Map(veri.shiftTemplates.map((t) => [t.id, t]));
    return m;
  }, [veri.shiftTemplates]);

  const assignByDate = useMemo(
    () => new Map(veri.assignments.map((a) => [a.date, a.shiftTemplateId])),
    [veri.assignments]
  );

  const todayISO = toISODate(new Date());

  const total = weekDates.reduce((sum, d) => {
    const sid = assignByDate.get(toISODate(d));
    const t = sid ? shiftById.get(sid) : undefined;
    return sum + (t ? shiftHours(t) : 0);
  }, 0);
  const overtime = Math.round(Math.max(0, total - WEEKLY_LIMIT_HOURS) * 10) / 10;

  return (
    <main className="sayfa max-w-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Vardiya programı
          </p>
          <div className="mt-1 flex items-center gap-2.5">
            <span
              className={`h-3 w-3 shrink-0 rounded-full ${
                COLOR_CLASSES[veri.employee.color]?.dot ?? "bg-zinc-400"
              }`}
            />
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
              {veri.employee.name}
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {veri.employee.role || "Görev belirtilmemiş"} · {veri.businessName}
          </p>
        </div>
        <Link href="/" className="btn-ikincil btn-kucuk shrink-0">
          Vardiya
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
        <span>
          Yıllık izin hakkı:{" "}
          <strong className="text-zinc-800">{veri.employee.annualLeaveDays} gün</strong>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
          Salt-okunur
        </span>
      </div>

      {veri.taslakHaftaVar && (
        <p className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          Yeni bir plan hazırlanıyor; yayınlanınca burada görünecek.
        </p>
      )}

      {veri.announcements.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
            Duyurular
          </div>
          <ul className="mt-1.5 space-y-1">
            {veri.announcements.slice(0, 3).map((a) => (
              <li key={a.id}>• {a.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Hafta gezinme */}
      <div className="mt-5 flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-2 py-1.5">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="btn-sessiz btn-kucuk"
          aria-label="Önceki hafta"
        >
          ←
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold">{formatWeekRange(weekDates)}</div>
          <div className={`text-[11px] ${overtime > 0 ? "text-amber-700" : "text-zinc-500"}`}>
            {total} saat
            {overtime > 0 ? ` · ${overtime} sa fazla mesai` : ""}
          </div>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-[11px] text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
            >
              Bu haftaya dön
            </button>
          )}
        </div>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="btn-sessiz btn-kucuk"
          aria-label="Sonraki hafta"
        >
          →
        </button>
      </div>

      {/* Günlük program */}
      <ul className="kart mt-3 divide-y divide-zinc-100 overflow-hidden">
        {weekDates.map((d) => {
          const iso = toISODate(d);
          const shiftId = assignByDate.get(iso);
          const t = shiftId ? shiftById.get(shiftId) : undefined;
          const dayName = DAY_NAMES_TR[(d.getDay() + 6) % 7];
          const holiday = getHoliday(iso);
          const bugun = iso === todayISO;
          return (
            <li
              key={iso}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${
                bugun ? "bg-amber-50/60" : ""
              }`}
            >
              <span className="text-sm text-zinc-600">
                {dayName} <span className="text-zinc-400">{formatShort(d)}</span>
                {bugun && (
                  <span className="ml-2 rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    bugün
                  </span>
                )}
                {holiday && (
                  <span
                    className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle"
                    title={holiday.name}
                  />
                )}
              </span>
              {t ? (
                <span
                  className={`rounded-lg border px-2.5 py-1 text-xs ${
                    COLOR_CLASSES[t.color]?.chip ?? ""
                  }`}
                >
                  {t.name} · {shiftSaatMetni(t)}
                </span>
              ) : (
                <span className="text-xs text-zinc-400">İzin / boş</span>
              )}
            </li>
          );
        })}
      </ul>

      <a href={`/api/calendar/${veri.token}`} className="btn-ikincil mt-5">
        Telefon takvimine ekle (.ics)
      </a>

      <p className="mt-6 text-xs leading-relaxed text-zinc-400">
        Bu ekran yalnızca görüntüleme içindir; değişiklik yapılamaz. Programla ilgili
        düzeltme için işletme yöneticisine başvur. Bu bağlantıyı bilen herkes programı
        görebilir — kişisel bir bağlantıdır, herkese açık yerde paylaşma.
      </p>
    </main>
  );
}
