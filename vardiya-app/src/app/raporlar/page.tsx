"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { StatePayload } from "@/lib/types";
import { fetchState } from "@/lib/api-client";
import { MONTH_SHORT_TR, toISODate } from "@/lib/dates";
import { shiftHours } from "@/lib/shifts";

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

export default function RaporlarPage() {
  const [data, setData] = useState<StatePayload | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    fetchState().then(setData).catch(() => setData(null));
  }, []);

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
      for (const a of monthAssignments) {
        if (a.employeeId !== e.id) continue;
        const t = shiftById.get(a.shiftTemplateId);
        if (t) hours += shiftHours(t);
      }
      hours = Math.round(hours * 10) / 10;
      const leaveUsed = data.requests.filter(
        (r) => r.employeeId === e.id && r.status === "approved" && r.type === "izin"
      ).length;
      return {
        id: e.id,
        name: e.name,
        color: e.color,
        hours,
        cost: Math.round(hours * (e.hourlyWage || 0)),
        leaveLeft: Math.max(0, (e.annualLeaveDays ?? 0) - leaveUsed),
      };
    });
  }, [data, monthAssignments, shiftById]);

  const totalHours = Math.round(rows.reduce((s, r) => s + r.hours, 0) * 10) / 10;
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);

  const dailyHours = useMemo(() => {
    return days.map((iso) => {
      let h = 0;
      for (const a of monthAssignments) {
        if (a.date !== iso) continue;
        const t = shiftById.get(a.shiftTemplateId);
        if (t) h += shiftHours(t);
      }
      return h;
    });
  }, [days, monthAssignments, shiftById]);
  const maxDaily = Math.max(1, ...dailyHours);

  function exportCsv() {
    const head = ["Personel", "Saat", "Maliyet (TL)", "Kalan İzin (gün)"];
    const lines = [head.join(";")];
    for (const r of rows) {
      lines.push([r.name, String(r.hours), String(r.cost), String(r.leaveLeft)].join(";"));
    }
    lines.push(["TOPLAM", String(totalHours), String(totalCost), ""].join(";"));
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vardiya-rapor-${prefix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!data) {
    return (
      <main className="flex-1 grid place-items-center">
        <p className="text-zinc-500">Yükleniyor…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Raporlar</h1>
          <p className="mt-1 text-zinc-500">{data.business.name}</p>
        </div>
        <Link href="/panel" className="text-sm text-zinc-500 hover:underline">
          ← Panele dön
        </Link>
      </div>

      {/* Ay gezinme */}
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

      {/* Özet */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Toplam saat</div>
          <div className="mt-1 text-2xl font-semibold">{totalHours} sa</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Tahmini işçilik maliyeti</div>
          <div className="mt-1 text-2xl font-semibold">
            {totalCost > 0 ? `≈ ${totalCost.toLocaleString("tr-TR")} ₺` : "—"}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col justify-center">
          <button
            onClick={exportCsv}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            ⬇ CSV indir
          </button>
        </div>
      </div>

      {/* Günlük dağılım */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-700">Günlük çalışılan saat</h3>
        <div className="mt-4 flex h-28 items-end gap-[3px]">
          {dailyHours.map((h, i) => (
            <div
              key={i}
              title={`${days[i]} · ${h} sa`}
              className="flex-1 rounded-t bg-zinc-900/80"
              style={{ height: `${Math.max(2, (h / maxDaily) * 100)}%`, opacity: h === 0 ? 0.15 : 1 }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-zinc-400">
          <span>1 {MONTH_SHORT_TR[first.getMonth()]}</span>
          <span>{days.length} {MONTH_SHORT_TR[first.getMonth()]}</span>
        </div>
      </div>

      {/* Personel tablosu */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 text-zinc-500">
              <th className="px-4 py-3 text-left font-medium">Personel</th>
              <th className="px-4 py-3 text-right font-medium">Saat</th>
              <th className="px-4 py-3 text-right font-medium">Maliyet</th>
              <th className="px-4 py-3 text-right font-medium">Kalan izin</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-zinc-100">
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2 text-right font-medium">{r.hours} sa</td>
                <td className="px-4 py-2 text-right">
                  {r.cost > 0 ? `≈ ${r.cost.toLocaleString("tr-TR")} ₺` : "—"}
                </td>
                <td className="px-4 py-2 text-right text-zinc-500">{r.leaveLeft} gün</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-200 bg-zinc-50 font-semibold">
              <td className="px-4 py-3">Toplam</td>
              <td className="px-4 py-3 text-right">{totalHours} sa</td>
              <td className="px-4 py-3 text-right">
                {totalCost > 0 ? `≈ ${totalCost.toLocaleString("tr-TR")} ₺` : "—"}
              </td>
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-4 text-xs text-zinc-400">
        Saatler atanmış vardiyalardan hesaplanır. Maliyet, personelin saatlik ücreti girilmişse
        gösterilir.
      </p>
    </main>
  );
}
