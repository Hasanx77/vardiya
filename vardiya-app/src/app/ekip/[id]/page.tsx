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
        <p className="text-red-600">{error}</p>
      </main>
    );
  }
  if (!data) {
    return (
      <main className="flex-1 grid place-items-center">
        <p className="text-zinc-500">Yükleniyor…</p>
      </main>
    );
  }
  if (!employee) {
    return (
      <main className="flex-1 grid place-items-center px-4">
        <div className="text-center">
          <p className="text-zinc-600">Personel bulunamadı.</p>
          <Link href="/ekip" className="mt-2 inline-block text-sm text-zinc-500 underline">
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
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-10">
      <Link href="/ekip" className="text-sm text-zinc-500 hover:underline">
        ← Geri dön
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${COLOR_CLASSES[employee.color]?.dot ?? ""}`} />
        <div>
          <h1 className="text-2xl font-semibold">{employee.name}</h1>
          <p className="text-sm text-zinc-500">
            {employee.role} · {data.business.name}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm text-zinc-500">
        🌴 Yıllık izin hakkı: <strong className="text-zinc-800">{employee.annualLeaveDays} gün</strong>
      </p>

      {data.announcements.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold">📢 Duyurular</div>
          <ul className="mt-2 space-y-1">
            {data.announcements.slice(0, 3).map((a) => (
              <li key={a.id}>• {a.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Hafta gezinme */}
      <div className="mt-6 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
        >
          ←
        </button>
        <div className="text-center">
          <div className="font-semibold">{formatWeekRange(weekDates)}</div>
          <div className="text-xs text-zinc-500">
            Toplam {total} saat
            {overtime > 0 && (
              <span className="text-amber-600">
                {" "}
                · ⚠️ {overtime} sa fazla mesai ({WEEKLY_LIMIT_HOURS} sa üstü)
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
        >
          →
        </button>
      </div>

      {/* Günlük program */}
      <ul className="mt-4 space-y-2">
        {weekDates.map((d) => {
          const iso = toISODate(d);
          const shiftId = assignMap.get(`${employee.id}__${iso}`);
          const t = shiftId ? templateById.get(shiftId) : undefined;
          const dayName = DAY_NAMES_TR[(d.getDay() + 6) % 7];
          const holiday = getHoliday(iso);
          return (
            <li
              key={iso}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3"
            >
              <span className="text-sm text-zinc-600">
                {dayName} <span className="text-zinc-400">{formatShort(d)}</span>
                {holiday && <span className="ml-1 text-red-500" title={holiday.name}>🎉</span>}
              </span>
              {t ? (
                <span
                  className={`rounded-lg border px-3 py-1 text-xs ${
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
        className="mt-6 inline-block rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
      >
        📅 Telefon takvimine ekle (.ics)
      </a>

      <p className="mt-6 text-xs text-zinc-400">
        Bu ekran yalnızca görüntüleme içindir. Değişiklikler için işletme ile iletişime geç.
      </p>
    </main>
  );
}
