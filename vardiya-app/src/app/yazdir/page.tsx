"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { StatePayload } from "@/lib/types";
import { fetchState } from "@/lib/api-client";
import { DAY_NAMES_TR, formatShort, formatWeekRange, getWeekDates, toISODate } from "@/lib/dates";
import { getHoliday } from "@/lib/holidays";

export default function PrintPage() {
  const [data, setData] = useState<StatePayload | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    fetchState().then(setData).catch(() => setData(null));
  }, []);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const shiftById = useMemo(() => {
    const m = new Map<string, StatePayload["shiftTemplates"][number]>();
    data?.shiftTemplates.forEach((t) => m.set(t.id, t));
    return m;
  }, [data]);

  const assignMap = useMemo(() => {
    const m = new Map<string, string>();
    data?.assignments.forEach((a) => m.set(`${a.employeeId}__${a.date}`, a.shiftTemplateId));
    return m;
  }, [data]);

  const dayNoteMap = useMemo(() => {
    const m = new Map<string, string>();
    data?.dayNotes.forEach((d) => m.set(d.date, d.note));
    return m;
  }, [data]);

  if (!data) {
    return (
      <main className="flex-1 grid place-items-center">
        <p className="text-zinc-500">Yükleniyor…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8">
      <div className="print:hidden mb-4 flex items-center justify-between">
        <Link href="/panel" className="text-sm text-zinc-500 hover:underline">
          ← Panele dön
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
          >
            ←
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
          >
            →
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            🖨 Yazdır
          </button>
        </div>
      </div>

      <h1 className="text-xl font-semibold">{data.business.name} — Haftalık Vardiya Çizelgesi</h1>
      <p className="text-sm text-zinc-500">{formatWeekRange(weekDates)}</p>

      <table className="mt-5 w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-zinc-300 bg-zinc-100 p-2 text-left">Personel</th>
            {weekDates.map((d) => {
              const iso = toISODate(d);
              const holiday = getHoliday(iso);
              return (
                <th
                  key={iso}
                  className={`border border-zinc-300 p-2 ${holiday ? "bg-red-50" : "bg-zinc-100"}`}
                >
                  {DAY_NAMES_TR[(d.getDay() + 6) % 7]}
                  <span className="block font-normal text-zinc-500">{formatShort(d)}</span>
                  {holiday && (
                    <span className="block text-[10px] font-normal text-red-600" title={holiday.name}>
                      {holiday.name}
                    </span>
                  )}
                  {dayNoteMap.get(iso) && (
                    <span className="block text-[10px] font-normal text-sky-700">
                      📝 {dayNoteMap.get(iso)}
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
              <td className="border border-zinc-300 p-2 font-medium whitespace-nowrap">
                {emp.name}
                <span className="block text-[10px] font-normal text-zinc-500">{emp.role}</span>
              </td>
              {weekDates.map((d) => {
                const sid = assignMap.get(`${emp.id}__${toISODate(d)}`);
                const t = sid ? shiftById.get(sid) : undefined;
                return (
                  <td key={toISODate(d)} className="border border-zinc-300 p-2 text-center">
                    {t ? (
                      <>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-[10px] text-zinc-500">
                          {t.start}–{t.end}
                        </div>
                      </>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4 text-[11px] text-zinc-400">
        Bu çizelge Vardiya ile oluşturuldu. Güncel sürümü her zaman uygulamadan kontrol edin.
      </p>
    </main>
  );
}
