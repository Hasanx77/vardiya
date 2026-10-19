"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { StatePayload } from "@/lib/types";
import { MONTH_SHORT_TR, toISODate } from "@/lib/dates";
import { shiftHours } from "@/lib/shifts";
import { COLOR_CLASSES } from "@/lib/colors";
import { csvIndir } from "@/lib/csv";
import SayfaBasligi from "@/components/SayfaBasligi";

function monthRange(offset: number) {
  const base = new Date();
  const first = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const prefix = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}`;
  const days: string[] = [];
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(toISODate(new Date(first.getFullYear(), first.getMonth(), d)));
  }
  return { first, prefix, days };
}

export default function RaporlarClient({ initialData }: { initialData: StatePayload }) {
  const data = initialData;
  const [offset, setOffset] = useState(0);

  const { first, prefix, days } = useMemo(() => monthRange(offset), [offset]);

  const shiftById = useMemo(() => {
    const m = new Map<string, StatePayload["shiftTemplates"][number]>();
    data?.shiftTemplates.forEach((t) => m.set(t.id, t));
    return m;
  }, [data]);

  const monthAssignments = useMemo(
    () => data?.assignments.filter((a) => a.date.startsWith(prefix)) ?? [],
    [data, prefix]
  );

  const rows = useMemo(() => {
    if (!data) return [];
    return data.employees.map((e) => {
      let hours = 0;
      let workedDays = 0;
      for (const a of monthAssignments) {
        if (a.employeeId !== e.id) continue;
        const t = shiftById.get(a.shiftTemplateId);
        if (!t) continue;
        hours += shiftHours(t);
        workedDays += 1;
      }
      return {
        id: e.id,
        name: e.name,
        role: e.role,
        color: e.color,
        hours: Math.round(hours * 10) / 10,
        workedDays,
        leaveDays: e.annualLeaveDays ?? 0,
      };
    });
  }, [data, monthAssignments, shiftById]);

  const totalHours = Math.round(rows.reduce((s, r) => s + r.hours, 0) * 10) / 10;

  const dailyHours = useMemo(
    () =>
      days.map((iso) => {
        let h = 0;
        for (const a of monthAssignments) {
          if (a.date !== iso) continue;
          const t = shiftById.get(a.shiftTemplateId);
          if (t) h += shiftHours(t);
        }
        return h;
      }),
    [days, monthAssignments, shiftById]
  );

  const workedDayCount = dailyHours.filter((h) => h > 0).length;
  const average = workedDayCount > 0 ? Math.round((totalHours / workedDayCount) * 10) / 10 : 0;
  const maxDaily = Math.max(1, ...dailyHours);

  function exportCsv() {
    const satirlar: (string | number)[][] = [
      ["Personel", "Görev", "Çalışılan gün", "Saat", "İzin hakkı (gün)"],
      ...rows.map((r) => [r.name, r.role, r.workedDays, r.hours, r.leaveDays]),
      ["TOPLAM", "", "", totalHours, ""],
    ];
    csvIndir(`vardiya-rapor-${prefix}.csv`, satirlar);
  }

  if (!data) {
    return (
      <main className="flex-1 grid place-items-center">
        <p className="text-sm text-zinc-500">Yükleniyor…</p>
      </main>
    );
  }

  return (
    <main className="sayfa max-w-5xl">
      <SayfaBasligi ust="Raporlar" baslik="Aylık özet" alt={data.business.name} />

      {/* Ay gezinme */}
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

      {/* Özet */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="kart p-4">
          <div className="text-xs text-zinc-500">Toplam saat</div>
          <div className="mt-1 text-2xl font-semibold">{totalHours} sa</div>
        </div>
        <div className="kart p-4">
          <div className="text-xs text-zinc-500">Çalışılan gün</div>
          <div className="mt-1 text-2xl font-semibold">{workedDayCount}</div>
        </div>
        <div className="kart p-4">
          <div className="text-xs text-zinc-500">Ortalama (çalışılan gün)</div>
          <div className="mt-1 text-2xl font-semibold">{average} sa</div>
        </div>
        <div className="kart flex items-center p-4">
          <button onClick={exportCsv} className="btn-birincil w-full">
            CSV indir
          </button>
        </div>
      </div>

      {/* Günlük dağılım */}
      <div className="kart mt-4 p-4">
        <h2 className="text-sm font-semibold text-zinc-800">Günlük çalışılan saat</h2>
        <div className="mt-4 flex h-28 items-end gap-[3px]" role="img" aria-label="Günlük çalışılan saat grafiği">
          {dailyHours.map((h, i) => (
            <div
              key={i}
              title={`${days[i]} · ${h} sa`}
              className="flex-1 rounded-t bg-zinc-900/80"
              style={{
                height: `${Math.max(2, (h / maxDaily) * 100)}%`,
                opacity: h === 0 ? 0.12 : 1,
              }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-zinc-400">
          <span>1 {MONTH_SHORT_TR[first.getMonth()]}</span>
          <span>
            {days.length} {MONTH_SHORT_TR[first.getMonth()]}
          </span>
        </div>
      </div>

      {/* Personel tablosu */}
      {rows.length === 0 ? (
        <div className="kart mt-4 border-dashed p-10 text-center">
          <p className="text-sm font-medium text-zinc-700">Henüz personel yok.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Personel ekledikten sonra aylık saatler burada görünür.
          </p>
          <Link href="/panel" className="btn-birincil mt-4">
            Panele git
          </Link>
        </div>
      ) : (
        <div className="kart mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs text-zinc-500">
                <th className="px-4 py-2.5 text-left font-semibold">Personel</th>
                <th className="px-4 py-2.5 text-right font-semibold">Gün</th>
                <th className="px-4 py-2.5 text-right font-semibold">Saat</th>
                <th className="px-4 py-2.5 text-right font-semibold">İzin hakkı</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-zinc-100">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${COLOR_CLASSES[r.color]?.dot ?? "bg-zinc-400"}`} />
                      <span className="font-medium">{r.name}</span>
                      {r.role && <span className="text-xs text-zinc-400">{r.role}</span>}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-zinc-600">{r.workedDays}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{r.hours} sa</td>
                  <td className="px-4 py-2.5 text-right text-zinc-500">{r.leaveDays} gün</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-200 bg-zinc-50 font-semibold">
                <td className="px-4 py-2.5">Toplam</td>
                <td className="px-4 py-2.5" />
                <td className="px-4 py-2.5 text-right">{totalHours} sa</td>
                <td className="px-4 py-2.5" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-zinc-400">
        Saatler atanmış vardiyalardan hesaplanır. Ücret veya maliyet kaydı tutulmaz.
      </p>
    </main>
  );
}
