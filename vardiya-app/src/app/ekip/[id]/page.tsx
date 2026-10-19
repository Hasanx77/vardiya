"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { StatePayload } from "@/lib/types";
import { fetchState } from "@/lib/api-client";
import { DAY_NAMES_TR, formatShort, formatWeekRange, getWeekDates, toISODate } from "@/lib/dates";
import { shiftHours, WEEKLY_LIMIT_HOURS } from "@/lib/shifts";
import { COLOR_CLASSES } from "@/lib/colors";
import { getHoliday } from "@/lib/holidays";

export default function EmployeePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [data, setData] = useState<StatePayload | null>(null);
  const [error, setError] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    fetchState()
      .then(setData)
      .catch(() => setError("Sunucuya ulaşılamadı."));
  }, []);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const employee = data?.employees.find((e) => e.id === id);
  const templateById = useMemo(() => {
    const m = new Map<string, StatePayload["shiftTemplates"][number]>();
    data?.shiftTemplates.forEach((t) => m.set(t.id, t));
    return m;
  }, [data]);

  const assignMap = useMemo(() => {
    const m = new Map<string, string>();
    data?.assignments.forEach((a) => m.set(`${a.employeeId}__${a.date}`, a.shiftTemplateId));
    return m;
  }, [data]);

  if (error) {
    return (
      <main className="flex-1 grid place-items-center px-4">
        <p className="text-sm text-red-600">{error}</p>
      </main>
    );
  }
  if (!data) {
    return (
      <main className="flex-1 grid place-items-center">
        <p className="text-sm text-zinc-500">Yükleniyor…</p>
      </main>
    );
  }
  if (!employee) {
    return (
      <main className="flex-1 grid place-items-center px-4">
        <div className="text-center">
          <p className="text-sm text-zinc-600">Personel bulunamadı.</p>
          <Link href="/ekip" className="btn-ikincil mt-3">
            ← Geri dön
          </Link>
        </div>
      </main>
    );
  }

  const total = weekDates.reduce((sum, d) => {
    const shiftId = assignMap.get(`${employee.id}__${toISODate(d)}`);
    const t = shiftId ? templateById.get(shiftId) : undefined;
    return sum + (t ? shiftHours(t) : 0);
  }, 0);
  const overtime = Math.round(Math.max(0, total - WEEKLY_LIMIT_HOURS) * 10) / 10;

  return (
    <main className="sayfa max-w-2xl">
      <Link
        href="/ekip"
        className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
      >
        ← Personel listesi
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${COLOR_CLASSES[employee.color]?.dot ?? ""}`} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{employee.name}</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {employee.role || "Görev yok"} · {data.business.name}
          </p>
        </div>
      </div>

      <p className="mt-2 text-sm text-zinc-500">
        Yıllık izin hakkı: <strong className="text-zinc-800">{employee.annualLeaveDays} gün</strong>
      </p>

      {data.announcements.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">Duyurular</div>
          <ul className="mt-1.5 space-y-1">
            {data.announcements.slice(0, 3).map((a) => (
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
          const shiftId = assignMap.get(`${employee.id}__${iso}`);
          const t = shiftId ? templateById.get(shiftId) : undefined;
          const dayName = DAY_NAMES_TR[(d.getDay() + 6) % 7];
          const holiday = getHoliday(iso);
          return (
            <li key={iso} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-zinc-600">
                {dayName} <span className="text-zinc-400">{formatShort(d)}</span>
                {holiday && (
                  <span className="ml-1 text-red-500" title={holiday.name}>
                    🎉
                  </span>
                )}
              </span>
              {t ? (
                <span
                  className={`rounded-lg border px-2.5 py-1 text-xs ${
                    COLOR_CLASSES[t.color]?.chip ?? ""
                  }`}
                >
                  {t.name} · {t.start}–{t.end}
                </span>
              ) : (
                <span className="text-xs text-zinc-400">İzin / boş</span>
              )}
            </li>
          );
        })}
      </ul>

      <a
        href={`/api/calendar/${employee.id}`}
        className="btn-ikincil mt-5"
      >
        Telefon takvimine ekle (.ics)
      </a>

      <p className="mt-6 text-xs text-zinc-400">
        Bu ekran yalnızca görüntüleme içindir. Değişiklik için işletme ile iletişime geç.
      </p>
    </main>
  );
}
