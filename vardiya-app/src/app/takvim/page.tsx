"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { StatePayload } from "@/lib/types";
import { fetchState } from "@/lib/api-client";
import { DAY_SHORT_TR, MONTH_SHORT_TR, toISODate } from "@/lib/dates";
import { getHoliday } from "@/lib/holidays";
import { COLOR_CLASSES } from "@/lib/colors";

export default function TakvimPage() {
  const [data, setData] = useState<StatePayload | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    fetchState().then(setData).catch(() => setData(null));
  }, []);

  const { first, days } = useMemo(() => {
    const base = new Date();
    const firstDate = new Date(base.getFullYear(), base.getMonth() + offset, 1);
    const lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth() + 1, 0);
    const list: string[] = [];
    for (let d = 1; d <= lastDate.getDate(); d++) {
      list.push(toISODate(new Date(firstDate.getFullYear(), firstDate.getMonth(), d)));
    }
    return { first: firstDate, days: list };
  }, [offset]);

  const startIdx = (first.getDay() + 6) % 7; // Pazartesi = 0

  const byDay = useMemo(() => {
    const m = new Map<string, Map<string, string[]>>();
    if (!data) return m;
    const empName = new Map(data.employees.map((e) => [e.id, e.name]));
    for (const a of data.assignments) {
      if (!a.date.startsWith(`${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}`))
        continue;
      const dayMap = m.get(a.date) ?? new Map<string, string[]>();
      const arr = dayMap.get(a.shiftTemplateId) ?? [];
      const name = empName.get(a.employeeId);
      if (name) arr.push(name);
      dayMap.set(a.shiftTemplateId, arr);
      m.set(a.date, dayMap);
    }
    return m;
  }, [data, first]);

  if (!data) {
    return (
      <main className="flex-1 grid place-items-center">
        <p className="text-zinc-500">Yükleniyor…</p>
      </main>
    );
  }

  const templateById = new Map(data.shiftTemplates.map((t) => [t.id, t]));

  return (
    <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Takvim</h1>
          <p className="mt-1 text-zinc-500">{data.business.name}</p>
        </div>
        <Link href="/panel" className="text-sm text-zinc-500 hover:underline">
          ← Panele dön
        </Link>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={() => setOffset((o) => o - 1)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
        >
          ←
        </button>
        <div className="font-semibold">
          {MONTH_SHORT_TR[first.getMonth()]} {first.getFullYear()}
        </div>
        <button
          onClick={() => setOffset((o) => o + 1)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
        >
          →
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-center text-xs font-medium text-zinc-500">
          {DAY_SHORT_TR.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startIdx }).map((_, i) => (
            <div key={`b${i}`} className="min-h-[96px] border-b border-r border-zinc-100 bg-zinc-50/50" />
          ))}
          {days.map((iso, i) => {
            const dayNum = Number(iso.slice(-2));
            const holiday = getHoliday(iso);
            const dayMap = byDay.get(iso);
            const cellIdx = startIdx + i + 1;
            return (
              <div
                key={iso}
                className={`min-h-[96px] border-b border-r border-zinc-100 p-1.5 ${
                  cellIdx % 7 === 0 ? "border-r-0" : ""
                }`}
              >
                <div
                  className={`text-xs font-semibold ${
                    holiday ? "text-red-600" : "text-zinc-500"
                  }`}
                  title={holiday?.name}
                >
                  {dayNum}
                  {holiday ? " 🎉" : ""}
                </div>
                <div className="mt-1 space-y-0.5">
                  {dayMap &&
                    data.shiftTemplates
                      .filter((t) => dayMap.has(t.id))
                      .map((t) => (
                        <div
                          key={t.id}
                          className={`truncate rounded border px-1 py-0.5 text-[10px] leading-tight ${
                            COLOR_CLASSES[t.color]?.chip ?? ""
                          }`}
                          title={`${t.name}: ${(dayMap.get(t.id) ?? []).join(", ")}`}
                        >
                          <strong>{t.name}:</strong> {(dayMap.get(t.id) ?? []).join(", ")}
                        </div>
                      ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {data.shiftTemplates.map((t) => (
          <span
            key={t.id}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] ${
              COLOR_CLASSES[t.color]?.chip ?? ""
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${COLOR_CLASSES[t.color]?.dot ?? ""}`} />
            {t.name}
          </span>
        ))}
      </div>
    </main>
  );
}
