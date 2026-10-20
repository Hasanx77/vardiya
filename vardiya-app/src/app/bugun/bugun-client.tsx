"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Employee, StatePayload } from "@/lib/types";
import { fetchState } from "@/lib/api-client";
import { formatDayDate, toISODate } from "@/lib/dates";
import { COLOR_CLASSES } from "@/lib/colors";
import { shiftSaatMetni } from "@/lib/shifts";
import SayfaBasligi from "@/components/SayfaBasligi";

export default function BugunClient({ initialData }: { initialData: StatePayload }) {
  const [data, setData] = useState<StatePayload | null>(initialData);
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

    // Veri sunucudan hazır geldi; hemen ikinci istek atmıyoruz.
    // Tablet ekranı açık kaldığı için dakikada bir tazeliyoruz.
    const id = window.setInterval(() => {
      load();
      setNow(new Date());
    }, 60_000);

    // Sekmeye geri dönünce eski programı göstermesin.
    function gorunur() {
      if (document.visibilityState === "visible") {
        load();
        setNow(new Date());
      }
    }
    document.addEventListener("visibilitychange", gorunur);

    return () => {
      alive = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", gorunur);
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
        <p className="text-sm text-zinc-500">Yükleniyor…</p>
      </main>
    );
  }

  const not = data.dayNotes.find((d) => d.date === todayISO)?.note;

  return (
    <main className="sayfa max-w-4xl">
      <SayfaBasligi
        ust="Bugün"
        baslik="Kim çalışıyor?"
        alt={`${data.business.name} · ${formatDayDate(now)}`}
      />

      {data.announcements.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
            Duyuru
          </div>
          <p className="mt-1 text-lg leading-snug">{data.announcements[0].message}</p>
        </div>
      )}

      {not && (
        <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <span className="font-semibold">Günün notu:</span> {not}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {data.shiftTemplates.map((t) => {
          const list = working.get(t.id) ?? [];
          if (list.length === 0) return null;
          return (
            <section key={t.id} className="kart overflow-hidden">
              <div className={`flex items-center justify-between border-b px-4 py-2.5 ${COLOR_CLASSES[t.color]?.chip ?? "border-zinc-200"}`}>
                <h2 className="text-sm font-semibold">
                  {t.name}{" "}
                  <span className="font-normal opacity-75">
                    {shiftSaatMetni(t)}
                  </span>
                </h2>
                <span className="text-xs opacity-75">{list.length} kişi</span>
              </div>
              <ul className="divide-y divide-zinc-100">
                {list.map((e) => (
                  <li key={e.id} className="flex items-baseline justify-between gap-3 px-4 py-3">
                    <span className="text-lg font-medium text-zinc-800">{e.name}</span>
                    <span className="text-xs text-zinc-500">{e.role}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {off.length > 0 && (
        <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Bugün izinli / atanmamış ({off.length})
          </h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {off.map((e) => (
              <li key={e.id} className="rounded-lg bg-zinc-100 px-2.5 py-1 text-sm text-zinc-600">
                {e.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {working.size === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-10 text-center">
          <p className="text-sm font-medium text-zinc-700">Bugün için atanmış vardiya yok.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Haftalık plandan bugüne vardiya ekleyebilirsin.
          </p>
          <Link href="/panel" className="btn-birincil mt-4">
            Plana git
          </Link>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-zinc-400">
        Bu ekran her dakika kendini yeniler. Kafede bir tablete açık bırakabilirsin.
      </p>
    </main>
  );
}
