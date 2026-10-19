"use client";

import { useMemo, useState } from "react";
import type { StatePayload } from "@/lib/types";
import { DAY_SHORT_TR, MONTH_SHORT_TR, toISODate } from "@/lib/dates";
import { getHoliday } from "@/lib/holidays";
import { COLOR_CLASSES } from "@/lib/colors";
import SayfaBasligi from "@/components/SayfaBasligi";

export default function TakvimClient({ initialData }: { initialData: StatePayload }) {
  const data = initialData;
  const [offset, setOffset] = useState(0);

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
        <p className="text-sm text-zinc-500">Yükleniyor…</p>
      </main>
    );
  }

  const doluGunler = days.filter((iso) => byDay.has(iso));

  return (
    <main className="sayfa max-w-6xl">
      <SayfaBasligi ust="Takvim" baslik="Aylık görünüm" alt={data.business.name} />

      <div className="mt-5 flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-2 py-1.5">
        <button
          onClick={() => setOffset((o) => o - 1)}
          className="btn-sessiz btn-kucuk"
          aria-label="Önceki ay"
        >
          ←
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold">
            {MONTH_SHORT_TR[first.getMonth()]} {first.getFullYear()}
          </div>
          {offset !== 0 && (
            <button
              onClick={() => setOffset(0)}
              className="text-[11px] text-zinc-500 underline-offset-2 hover:underline"
            >
              Bu aya dön
            </button>
          )}
        </div>
        <button
          onClick={() => setOffset((o) => o + 1)}
          className="btn-sessiz btn-kucuk"
          aria-label="Sonraki ay"
        >
          →
        </button>
      </div>

      {/* Masaüstü takvim */}
      <div className="kart mt-4 hidden overflow-hidden sm:block">
        <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50 text-center text-[11px] font-semibold text-zinc-500">
          {DAY_SHORT_TR.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startIdx }).map((_, i) => (
            <div key={`b${i}`} className="min-h-[92px] border-b border-r border-zinc-100 bg-zinc-50/50" />
          ))}
          {days.map((iso, i) => {
            const dayNum = Number(iso.slice(-2));
            const holiday = getHoliday(iso);
            const dayMap = byDay.get(iso);
            const cellIdx = startIdx + i + 1;
            return (
              <div
                key={iso}
                className={`min-h-[92px] border-b border-r border-zinc-100 p-1.5 ${
                  cellIdx % 7 === 0 ? "border-r-0" : ""
                }`}
              >
                <div
                  className={`text-[11px] font-semibold ${holiday ? "text-red-600" : "text-zinc-500"}`}
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

      {/* Mobil ajanda */}
      <div className="mt-4 space-y-2 sm:hidden">
        {doluGunler.length === 0 ? (
          <div className="kart border-dashed p-8 text-center text-sm text-zinc-500">
            Bu ay için atanmış vardiya yok.
          </div>
        ) : (
          doluGunler.map((iso) => {
            const dayMap = byDay.get(iso);
            if (!dayMap) return null;
            const d = new Date(iso + "T00:00:00");
            const holiday = getHoliday(iso);
            return (
              <div key={iso} className="kart p-3">
                <div className="flex items-baseline justify-between">
                  <div className="text-sm font-semibold">
                    {DAY_SHORT_TR[(d.getDay() + 6) % 7]} {d.getDate()}{" "}
                    {MONTH_SHORT_TR[d.getMonth()]}
                  </div>
                  {holiday && (
                    <span className="text-[11px] font-medium text-red-600">{holiday.name}</span>
                  )}
                </div>
                <ul className="mt-2 space-y-1.5">
                  {data.shiftTemplates
                    .filter((t) => dayMap.has(t.id))
                    .map((t) => (
                      <li key={t.id} className="flex items-start gap-2 text-sm">
                        <span
                          className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] ${
                            COLOR_CLASSES[t.color]?.chip ?? ""
                          }`}
                        >
                          {t.name} {t.start}–{t.end}
                        </span>
                        <span className="text-zinc-700">{(dayMap.get(t.id) ?? []).join(", ")}</span>
                      </li>
                    ))}
                </ul>
              </div>
            );
          })
        )}
      </div>

      {days.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
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
      )}
    </main>
  );
}
