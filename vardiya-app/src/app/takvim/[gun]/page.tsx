import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getStatePayload } from "@/lib/state";
import { oturumGerekli } from "@/lib/oturum";
import { tarihGecerliMi, tarihAraligiKapsar } from "@/lib/izin";
import { gunEkleISO } from "@/lib/dates";
import { isoHaftaBasi } from "@/lib/yayin";
import { analyzeWeek } from "@/lib/compliance";
import { getHoliday } from "@/lib/holidays";
import { shiftHours, shiftSaatMetni } from "@/lib/shifts";
import { COLOR_CLASSES } from "@/lib/colors";
import { DIL_COOKIE, dilOku, t } from "@/lib/dil";

export const metadata = {
  title: "Gün detayı — Vardiya",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Gün detayı** — takvimde bir güne tıklayınca açılan sayfa.
 *
 * Neden ayrı sayfa: ay ızgarasında 10+ personel olan günler okunmuyordu.
 * Burada o günün tüm vardiyaları, kimlerin çalıştığı, izinliler, uyarılar ve
 * gün notu tek ekranda; panelde düzenlemeye tek tıkla geçilir.
 */
export default async function GunDetayPage({
  params,
}: {
  params: Promise<{ gun: string }>;
}) {
  const { gun } = await params;
  if (!tarihGecerliMi(gun) || !/^\d{4}-\d{2}-\d{2}$/.test(gun)) notFound();
  await oturumGerekli(`/takvim/${gun}`);
  const dil = dilOku((await cookies()).get(DIL_COOKIE)?.value);

  const data = await getStatePayload();
  const tarih = new Date(`${gun}T12:00:00`);
  if (Number.isNaN(tarih.getTime())) notFound();

  const gunAdi = new Intl.DateTimeFormat(dil === "en" ? "en-GB" : "tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(tarih);
  const holiday = getHoliday(gun);

  const haftaBasi = isoHaftaBasi(gun) ?? gun;
  const haftaGunleri = Array.from({ length: 7 }, (_, i) => gunEkleISO(haftaBasi, i));
  const yayinda = (data.publishedWeeks ?? []).includes(haftaBasi);

  const personelById = new Map(data.employees.map((e) => [e.id, e]));
  const sablonById = new Map(data.shiftTemplates.map((s) => [s.id, s]));

  const gunAtamalari = data.assignments.filter((a) => a.date === gun);
  const toplamSaat = gunAtamalari.reduce((t, a) => {
    const s = sablonById.get(a.shiftTemplateId);
    return t + (s ? shiftHours(s) : 0);
  }, 0);
  const kisiSayisi = new Set(gunAtamalari.map((a) => a.employeeId)).size;

  const gruplar = data.shiftTemplates
    .map((s) => ({
      sablon: s,
      kisiler: gunAtamalari
        .filter((a) => a.shiftTemplateId === s.id)
        .map((a) => personelById.get(a.employeeId))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    }))
    .filter((g) => g.kisiler.length > 0);

  const izinliler = (data.izinTalepleri ?? []).filter(
    (t) => t.durum === "onaylandi" && tarihAraligiKapsar(t.baslangic, t.bitis, gun),
  );

  const analiz = analyzeWeek({
    employees: data.employees.map((e) => ({ id: e.id, name: e.name })),
    shifts: data.shiftTemplates,
    assignments: data.assignments,
    weekDates: haftaGunleri,
    previousDate: gunEkleISO(haftaBasi, -1),
  });
  const gunUyarilari = analiz.issues.filter((u) => u.date === gun);

  const not = data.dayNotes.find((n) => n.date === gun)?.note ?? "";
  const onceki = gunEkleISO(gun, -1);
  const sonraki = gunEkleISO(gun, 1);
  const bugun = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());

  return (
    <main className="kap py-5 sm:py-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/takvim" className="text-[12.5px] text-zinc-500 hover:underline">
          ← {t(dil, "cal.title")}
        </Link>
        <div className="flex items-center gap-1.5">
          <Link href={`/takvim/${onceki}`} className="btn-sessiz h-8 w-8 !px-0" aria-label={t(dil, "cal.prevDay")}>
            ‹
          </Link>
          {bugun !== gun ? (
            <Link href={`/takvim/${bugun}`} className="btn-sessiz h-8 text-[11.5px]">
              {t(dil, "panel.today")}
            </Link>
          ) : null}
          <Link href={`/takvim/${sonraki}`} className="btn-sessiz h-8 w-8 !px-0" aria-label={t(dil, "cal.nextDay")}>
            ›
          </Link>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{t(dil, "cal.dayTitle")}</p>
          <h1 className="mt-1 text-[22px] font-semibold capitalize tracking-tight">{gunAdi}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px]">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                yayinda
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {yayinda ? t(dil, "cal.published") : t(dil, "cal.draft")}
            </span>
            {holiday ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] text-red-700 dark:bg-red-500/10 dark:text-red-300">
                {holiday.name}
              </span>
            ) : null}
            {izinliler.length ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                {t(dil, "cal.leaveCount", { n: izinliler.length })}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/panel?gun=${gun}`} className="btn-birincil h-9 text-[12.5px]">
            {t(dil, "cal.edit")}
          </Link>
          <Link href="/yazdir" className="btn-sessiz h-9 text-[12.5px]">
            {t(dil, "cal.print")}
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { ad: t(dil, "cal.working"), deger: `${kisiSayisi}`, alt: t(dil, "cal.within", { n: data.employees.length }) },
          { ad: t(dil, "cal.shifts"), deger: `${gunAtamalari.length}`, alt: t(dil, "cal.diffShifts", { n: gruplar.length }) },
          { ad: t(dil, "cal.totalHours"), deger: `${Math.round(toplamSaat * 10) / 10}`, alt: t(dil, "cal.dailyPlan") },
        ].map((k) => (
          <div key={k.ad} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-[11.5px] text-zinc-500">{k.ad}</div>
            <div className="mt-1 text-[22px] font-semibold tracking-tight">{k.deger}</div>
            <div className="text-[11px] text-zinc-400">{k.alt}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {gruplar.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-[13px] text-zinc-500 lg:col-span-2 dark:border-zinc-700">
            {t(dil, "cal.empty")}{" "}
            <Link href={`/panel?gun=${gun}`} className="underline underline-offset-2">
              {t(dil, "cal.fill")}
            </Link>
          </div>
        ) : (
          gruplar.map(({ sablon, kisiler }) => (
            <section
              key={sablon.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${COLOR_CLASSES[sablon.color]?.dot ?? "bg-zinc-400"}`} />
                  <h2 className="text-[13.5px] font-semibold">{sablon.name}</h2>
                </div>
                <span className="text-[12px] text-zinc-500">
                  {shiftSaatMetni(sablon)} · {shiftHours(sablon)} {t(dil, "genel.saat")}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {kisiler.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 rounded-lg bg-zinc-50 px-2.5 py-1.5 dark:bg-zinc-950">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                      {p.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px]">{p.name}</span>
                    <span className="text-[11px] text-zinc-500">{p.role}</span>
                  </li>
                ))}
                <li className="pt-1 text-[11.5px] text-zinc-500">
                  {kisiler.length} {t(dil, "genel.kisi")} · {kisiler.length * shiftHours(sablon)} {t(dil, "genel.saat")}
                </li>
              </ul>
            </section>
          ))
        )}
      </div>

      {izinliler.length ? (
        <section className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/30 dark:bg-amber-500/5">
          <h2 className="text-[13px] font-semibold text-amber-900 dark:text-amber-200">{t(dil, "cal.onLeave")}</h2>
          <ul className="mt-2 space-y-1 text-[12.5px] text-amber-900/90 dark:text-amber-100/90">
            {izinliler.map((talep) => (
              <li key={talep.id}>
                <strong>{personelById.get(talep.employeeId)?.name ?? t(dil, "panel.employee")}</strong> · {talep.tur}
                {talep.not ? ` · ${talep.not}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {gunUyarilari.length ? (
        <section className="mt-3 rounded-2xl border border-red-200 bg-red-50/50 p-4 dark:border-red-500/30 dark:bg-red-500/5">
          <h2 className="text-[13px] font-semibold text-red-800 dark:text-red-200">{t(dil, "cal.warnings")}</h2>
          <ul className="mt-2 space-y-1 text-[12.5px] text-red-800/90 dark:text-red-100/90">
            {gunUyarilari.map((u, i) => (
              <li key={`${u.employeeId}-${u.type}-${i}`}>
                <strong>{personelById.get(u.employeeId)?.name ?? t(dil, "panel.employee")}</strong> — {u.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {not ? (
        <section className="mt-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-[13px] font-semibold">{t(dil, "cal.note")}</h2>
          <p className="mt-1 text-[12.5px] text-zinc-600 dark:text-zinc-300">{not}</p>
        </section>
      ) : null}
    </main>
  );
}
