"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { StatePayload } from "@/lib/types";
import { fetchState } from "@/lib/api-client";
import { COLOR_CLASSES } from "@/lib/colors";
import { toISODate } from "@/lib/dates";

export default function EkipClient({ initialData }: { initialData: StatePayload }) {
  const [data, setData] = useState<StatePayload | null>(initialData);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchState()
      .then(setData)
      .catch(() => setError("Sunucuya ulaşılamadı."));
  }, []);

  const todayISO = toISODate(new Date());

  const templateById = useMemo(() => {
    const m = new Map<string, StatePayload["shiftTemplates"][number]>();
    data?.shiftTemplates.forEach((t) => m.set(t.id, t));
    return m;
  }, [data]);

  const todayByEmployee = useMemo(() => {
    const m = new Map<string, string>();
    data?.assignments
      .filter((a) => a.date === todayISO)
      .forEach((a) => m.set(a.employeeId, a.shiftTemplateId));
    return m;
  }, [data, todayISO]);

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

  return (
    <main className="sayfa max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Personel görünümü
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {data.business.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Bir isme dokun; bu haftaki programını gör.
          </p>
        </div>
        <Link href="/panel" className="btn-ikincil btn-kucuk shrink-0">
          ← Plan
        </Link>
      </div>

      {data.employees.length === 0 ? (
        <div className="kart mt-6 border-dashed p-10 text-center">
          <p className="text-sm font-medium text-zinc-700">Henüz personel eklenmemiş.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Panele dönüp personel eklediğinde burada listelenir.
          </p>
          <Link href="/panel" className="btn-birincil mt-4">
            Panele git
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {data.employees.map((emp) => {
            const shiftId = todayByEmployee.get(emp.id);
            const t = shiftId ? templateById.get(shiftId) : undefined;
            return (
              <Link
                key={emp.id}
                href={`/ekip/${emp.id}`}
                className="kart flex items-center gap-3 p-4 transition-colors hover:border-zinc-300"
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    COLOR_CLASSES[emp.color]?.dot ?? "bg-zinc-400"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{emp.name}</div>
                  <div className="truncate text-xs text-zinc-400">{emp.role || "Görev yok"}</div>
                </div>
                {t ? (
                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] ${
                      COLOR_CLASSES[t.color]?.chip ?? ""
                    }`}
                  >
                    Bugün {t.start}–{t.end}
                  </span>
                ) : (
                  <span className="shrink-0 text-[11px] text-zinc-400">Bugün izinli</span>
                )}
                <span className="text-zinc-300">→</span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
