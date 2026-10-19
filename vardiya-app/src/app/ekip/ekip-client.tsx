"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { StatePayload } from "@/lib/types";
import { COLOR_CLASSES } from "@/lib/colors";
import { toISODate } from "@/lib/dates";
import SayfaBasligi from "@/components/SayfaBasligi";

export default function EkipClient({ initialData }: { initialData: StatePayload }) {
  const data = initialData;

  const todayISO = toISODate(new Date());

  const templateById = useMemo(() => {
    const m = new Map<string, StatePayload["shiftTemplates"][number]>();
    data.shiftTemplates.forEach((t) => m.set(t.id, t));
    return m;
  }, [data.shiftTemplates]);

  const todayByEmployee = useMemo(() => {
    const m = new Map<string, string>();
    data.assignments
      .filter((a) => a.date === todayISO)
      .forEach((a) => m.set(a.employeeId, a.shiftTemplateId));
    return m;
  }, [data.assignments, todayISO]);

  return (
    <main className="sayfa max-w-3xl">
      <SayfaBasligi
        ust="Personel görünümü"
        baslik={data.business.name}
        alt="Bir isme dokun; bu haftaki programını gör."
      />

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
