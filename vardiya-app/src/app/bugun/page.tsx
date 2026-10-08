"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Employee, StatePayload } from "@/lib/types";
import { fetchState } from "@/lib/api-client";
import { formatDayDate, toISODate } from "@/lib/dates";
import { COLOR_CLASSES } from "@/lib/colors";

export default function BugunPage() {
  const [data, setData] = useState<StatePayload | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const s = await fetchState();
        if (alive) setData(s);
      } catch {
        /* yoksay */
      }
    }
    load();
    const id = window.setInterval(() => {
      load();
      setNow(new Date());
    }, 60_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const todayISO = toISODate(now);

  const { working, off } = useMemo(() => {
    const m = new Map<string, Employee[]>();
    const off: Employee[] = [];
    if (!data) return { working: m, off };
    const byDay = new Map<string, string>();
    data.assignments
      .filter((a) => a.date === todayISO)
      .forEach((a) => byDay.set(a.employeeId, a.shiftTemplateId));
    for (const e of data.employees) {
      const sid = byDay.get(e.id);
      if (sid) {
        const arr = m.get(sid) ?? [];
        arr.push(e);
        m.set(sid, arr);
      } else {
        off.push(e);
      }
    }
    return { working: m, off };
  }, [data, todayISO]);

  if (!data) {
    return (
      <main className="flex-1 grid place-items-center">
        <p className="text-zinc-500">Yükleniyor…</p>
      </main>
    );
  }

  const templateById = new Map(data.shiftTemplates.map((t) => [t.id, t]));

  return (
    <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Bugün kim çalışıyor?</h1>
          <p className="mt-1 text-zinc-500">
            {data.business.name} · {formatDayDate(now)}
          </p>
        </div>
        <Link href="/panel" className="print:hidden text-sm text-zinc-500 hover:underline">
          ← Panele dön
        </Link>
      </div>

      {data.announcements.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <div className="text-sm font-semibold">📢 Duyuru</div>
          <p className="mt-1 text-lg">{data.announcements[0].message}</p>
        </div>
      )}

      <div className="mt-8 space-y-6">
        {data.shiftTemplates.map((t) => {
          const list = working.get(t.id) ?? [];
          if (list.length === 0) return null;
          return (
            <section
              key={t.id}
              className={`rounded-2xl border p-5 shadow-sm ${
                COLOR_CLASSES[t.color]?.chip ?? "border-zinc-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {t.name} <span className="font-normal opacity-70">{t.start}–{t.end}</span>
                </h2>
                <span className="text-sm opacity-70">{list.length} kişi</span>
              </div>
              <ul className="mt-3 flex flex-wrap gap-3">
                {list.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-xl bg-white/80 px-4 py-2 text-lg font-medium text-zinc-800 shadow-sm"
                  >
                    {e.name}
                    <span className="ml-2 text-xs font-normal text-zinc-500">{e.role}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {off.length > 0 && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-zinc-500">
              Bugün izinli / atanmamış ({off.length})
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2 text-sm text-zinc-500">
              {off.map((e) => (
                <li key={e.id} className="rounded-lg bg-zinc-100 px-3 py-1">
                  {e.name}
                </li>
              ))}
            </ul>
          </section>
        )}

        {working.size === 0 && (
          <p className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500">
            Bugün için atanmış vardiya yok.
          </p>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-zinc-400">
        Bu ekran her dakika otomatik yenilenir. Kafede bir tablete açık bırakabilirsiniz.
      </p>
    </main>
  );
}
