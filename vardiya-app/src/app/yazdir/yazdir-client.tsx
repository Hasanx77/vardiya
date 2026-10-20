"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { StatePayload } from "@/lib/types";
import { DAY_NAMES_TR, formatShort, formatWeekRange, getWeekDates, toISODate } from "@/lib/dates";
import { getHoliday } from "@/lib/holidays";
import { shiftSaatMetni } from "@/lib/shifts";

/**
 * Duvara asılacak haftalık çizelge. Veri sunucudan hazır gelir; ekran
 * açılırken "Yükleniyor…" beklemez ve yazdırma çıktısı temiz kalır.
 */
export default function YazdirClient({ initialData }: { initialData: StatePayload }) {
  const data = initialData;
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const shiftById = useMemo(() => {
    const m = new Map<string, StatePayload["shiftTemplates"][number]>();
    data.shiftTemplates.forEach((t) => m.set(t.id, t));
    return m;
  }, [data.shiftTemplates]);

  const assignMap = useMemo(() => {
    const m = new Map<string, string>();
    data.assignments.forEach((a) => m.set(`${a.employeeId}__${a.date}`, a.shiftTemplateId));
    return m;
  }, [data.assignments]);

  const dayNoteMap = useMemo(() => {
    const m = new Map<string, string>();
    data.dayNotes.forEach((d) => m.set(d.date, d.note));
    return m;
  }, [data.dayNotes]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href="/panel" className="btn-sessiz btn-kucuk">
          ← Plan
        </Link>
        <div className="flex items-center gap-2">
          <div className="mr-1 text-sm font-medium">{formatWeekRange(weekDates)}</div>
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="btn-ikincil btn-kucuk"
            aria-label="Önceki hafta"
          >
            ←
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="btn-ikincil btn-kucuk"
            aria-label="Sonraki hafta"
          >
            →
          </button>
          <button onClick={() => window.print()} className="btn-birincil btn-kucuk">
            Yazdır
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 print:rounded-none print:border-0 print:p-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-lg font-semibold">{data.business.name}</h1>
          <p className="text-sm text-zinc-500">
            {formatWeekRange(weekDates)} · Haftalık vardiya çizelgesi
          </p>
        </div>

        {data.employees.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-300 p-10 text-center print:hidden">
            <p className="text-sm font-medium text-zinc-700">Yazdırılacak personel yok.</p>
            <p className="mt-1 text-sm text-zinc-500">
              Önce panele dönüp personel ve vardiya ekle.
            </p>
            <Link href="/panel" className="btn-birincil mt-4">
              Panele git
            </Link>
          </div>
        ) : (
          <>
            <table className="mt-4 w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border border-zinc-300 bg-zinc-100 p-2 text-left">Personel</th>
                  {weekDates.map((d) => {
                    const iso = toISODate(d);
                    const holiday = getHoliday(iso);
                    return (
                      <th
                        key={iso}
                        className={`border border-zinc-300 p-2 ${
                          holiday ? "bg-red-50" : "bg-zinc-100"
                        }`}
                      >
                        {DAY_NAMES_TR[(d.getDay() + 6) % 7]}
                        <span className="block font-normal text-zinc-500">{formatShort(d)}</span>
                        {holiday && (
                          <span
                            className="block text-[10px] font-normal text-red-600"
                            title={holiday.name}
                          >
                            {holiday.name}
                          </span>
                        )}
                        {dayNoteMap.get(iso) && (
                          <span className="block text-[10px] font-normal text-sky-700">
                            {dayNoteMap.get(iso)}
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {data.employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="whitespace-nowrap border border-zinc-300 p-2 font-medium">
                      {emp.name}
                      <span className="block text-[10px] font-normal text-zinc-500">
                        {emp.role}
                      </span>
                    </td>
                    {weekDates.map((d) => {
                      const sid = assignMap.get(`${emp.id}__${toISODate(d)}`);
                      const t = sid ? shiftById.get(sid) : undefined;
                      return (
                        <td
                          key={toISODate(d)}
                          className="border border-zinc-300 p-2 text-center"
                        >
                          {t ? (
                            <>
                              <div className="font-medium">{t.name}</div>
                              <div className="text-[10px] text-zinc-500">
                                {shiftSaatMetni(t)}
                              </div>
                            </>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-500">
              <div className="flex flex-wrap gap-2">
                {data.shiftTemplates.map((t) => (
                  <span key={t.id}>
                    {t.name} {shiftSaatMetni(t)}
                  </span>
                ))}
              </div>
              <span>Vardiya ile oluşturuldu · zihnora.com.tr</span>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
