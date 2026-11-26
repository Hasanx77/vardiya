"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { StatePayload } from "@/lib/types";
import { toISODate } from "@/lib/dates";
import { getHoliday } from "@/lib/holidays";
import { shiftHours } from "@/lib/shifts";
import { COLOR_CLASSES } from "@/lib/colors";
import { useDil } from "@/components/DilSaglayici";

/**
 * Aylık takvim — **özet** görünüm.
 *
 * Patron geri bildirimi (26 Kas 2026): "kaç kişi varsa o kadar sıkışır hücre;
 * üstüne gelip tıkladığım gün için yeni bir sayfa açılsın, orada detaylar olsun."
 *
 * Hücrelerde isim yok: yalnız gün, kişi/vardiya sayısı ve renk noktaları.
 * Hücrenin tamamı `/takvim/<gün>` sayfasına gider.
 */
type GunOzet = { kisi: number; vardiya: number; saat: number; sablonlar: string[] };

export default function TakvimClient({ initialData }: { initialData: StatePayload }) {
  const data = initialData;
  const { t, dil } = useDil();
  const [offset, setOffset] = useState(0);

  const yerel = dil === "en" ? "en-GB" : "tr-TR";
  const ayAdi = useMemo(
    () => new Intl.DateTimeFormat(yerel, { month: "long", year: "numeric" }).format(new Date()),
    [yerel],
  );
  const gunAdiKisa = useMemo(
    () => new Intl.DateTimeFormat(yerel, { weekday: "short" }),
    [yerel],
  );
  const ayBicim = useMemo(
    () => new Intl.DateTimeFormat(yerel, { month: "long", year: "numeric" }),
    [yerel],
  );

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
  const bugun = toISODate(new Date());

  const ozet = useMemo(() => {
    const m = new Map<string, GunOzet>();
    const ay = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}`;
    const sablonById = new Map(data.shiftTemplates.map((s) => [s.id, s]));
    const kisiSet = new Map<string, Set<string>>();
    for (const a of data.assignments) {
      if (!a.date.startsWith(ay)) continue;
      const s = sablonById.get(a.shiftTemplateId);
      const g = m.get(a.date) ?? { kisi: 0, vardiya: 0, saat: 0, sablonlar: [] };
      g.vardiya += 1;
      if (s) {
        g.saat += shiftHours(s);
        if (!g.sablonlar.includes(a.shiftTemplateId)) g.sablonlar.push(a.shiftTemplateId);
      }
      m.set(a.date, g);
      const set = kisiSet.get(a.date) ?? new Set<string>();
      set.add(a.employeeId);
      kisiSet.set(a.date, set);
    }
    for (const [gun, set] of kisiSet) {
      const g = m.get(gun);
      if (g) g.kisi = set.size;
    }
    return m;
  }, [data, first]);

  return (
    <main className="kap py-5 sm:py-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {t("cal.title")}
          </p>
          <h1 className="mt-1 text-[22px] font-semibold capitalize tracking-tight">
            {ayBicim.format(first)}
          </h1>
          <p className="mt-1 text-[13px] text-zinc-500">{t("cal.sub")}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOffset((o) => o - 1)}
            className="btn-sessiz h-9 w-9 !px-0"
            aria-label={t("cal.prev")}
          >
            ‹
          </button>
          {offset !== 0 ? (
            <button type="button" onClick={() => setOffset(0)} className="btn-sessiz h-9 text-[12px]">
              {t("cal.thisMonth")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setOffset((o) => o + 1)}
            className="btn-sessiz h-9 w-9 !px-0"
            aria-label={t("cal.next")}
          >
            ›
          </button>
        </div>
      </div>

      {/* Masaüstü ay ızgarası */}
      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white sm:block dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50 text-center text-[11px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
          {Array.from({ length: 7 }, (_, i) => {
            const gun = new Date(2026, 0, 5 + i); // 5 Ocak 2026 Pazartesi
            return (
              <div key={i} className="py-2 capitalize">
                {gunAdiKisa.format(gun)}
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startIdx }).map((_, i) => (
            <div
              key={`b${i}`}
              className="min-h-[94px] border-b border-r border-zinc-100 bg-zinc-50/40 last:border-r-0 dark:border-zinc-800 dark:bg-zinc-950/40"
            />
          ))}
          {days.map((iso) => {
            const d = new Date(`${iso}T12:00:00`);
            const holiday = getHoliday(iso);
            const g = ozet.get(iso);
            const bugunMu = iso === bugun;
            return (
              <Link
                key={iso}
                href={`/takvim/${iso}`}
                className={`group flex min-h-[94px] flex-col gap-1 border-b border-r border-zinc-100 p-2 transition-colors last:border-r-0 dark:border-zinc-800 ${
                  bugunMu ? "bg-amber-50/40 dark:bg-amber-500/10" : ""
                }`}
                aria-label={`${d.getDate()} ${ayAdi}${g ? `, ${t("genel.kisi")}: ${g.kisi}` : `, ${t("cal.noShift")}`}`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`text-[12px] font-semibold ${
                      bugunMu ? "text-amber-700 dark:text-amber-300" : "text-zinc-600 dark:text-zinc-300"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {holiday ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" title={holiday.name} />
                  ) : null}
                </div>

                {g ? (
                  <>
                    <div className="flex flex-wrap gap-1">
                      {g.sablonlar.slice(0, 4).map((id) => {
                        const s = data.shiftTemplates.find((x) => x.id === id);
                        if (!s) return null;
                        return (
                          <span
                            key={id}
                            className={`h-1.5 w-1.5 rounded-full ${COLOR_CLASSES[s.color]?.dot ?? "bg-zinc-400"}`}
                            aria-hidden
                          />
                        );
                      })}
                    </div>
                    <div className="mt-auto text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">
                      <span className="font-medium text-zinc-700 dark:text-zinc-200">
                        {g.kisi} {t("genel.kisi")}
                      </span>
                      <span className="mx-1 text-zinc-300 dark:text-zinc-600">·</span>
                      {g.vardiya} {t("genel.vardiya")}
                      {g.saat > 0 ? (
                        <span className="block text-[10.5px] text-zinc-400">
                          {Math.round(g.saat)} {t("genel.saat")}
                        </span>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <span className="mt-auto text-[11px] text-zinc-300 dark:text-zinc-600">—</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobil ajanda */}
      <div className="mt-4 space-y-1.5 sm:hidden">
        {days.map((iso) => {
          const d = new Date(`${iso}T12:00:00`);
          const holiday = getHoliday(iso);
          const g = ozet.get(iso);
          const bugunMu = iso === bugun;
          return (
            <Link
              key={iso}
              href={`/takvim/${iso}`}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                bugunMu
                  ? "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <span className="w-10 text-center">
                <span className="block text-[15px] font-semibold">{d.getDate()}</span>
                <span className="block text-[10px] uppercase text-zinc-400">
                  {gunAdiKisa.format(d)}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-medium">
                  {g ? `${g.kisi} ${t("genel.kisi")} · ${g.vardiya} ${t("genel.vardiya")}` : t("cal.noShift")}
                </span>
                <span className="block text-[11px] text-zinc-500">
                  {holiday ? holiday.name : g && g.saat > 0 ? `${Math.round(g.saat)} ${t("genel.saat")}` : "—"}
                </span>
              </span>
              <span className="text-zinc-400" aria-hidden>
                ›
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {data.shiftTemplates.map((s) => (
          <span
            key={s.id}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] ${COLOR_CLASSES[s.color]?.chip ?? ""}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${COLOR_CLASSES[s.color]?.dot ?? ""}`} />
            {s.name}
          </span>
        ))}
      </div>
    </main>
  );
}
