import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { oturumGerekli } from "@/lib/oturum";
import { ensureBusiness } from "@/lib/server-data";
import { istanbulGunu } from "@/lib/dates";
import { shiftHours } from "@/lib/shifts";
import { DIL_COOKIE, dilOku, t } from "@/lib/dil";

export const metadata = {
  title: "Geçmiş — Vardiya",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Son 3 ayın ay anahtarları: ["2026-09","2026-10","2026-11"] */
function sonAylar(adet = 3): string[] {
  const [y, m] = istanbulGunu().split("-").map(Number);
  const liste: string[] = [];
  for (let i = adet - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, (m || 1) - 1 - i, 1));
    liste.push(d.toISOString().slice(0, 7));
  }
  return liste;
}

function ayEtiketi(ay: string, dil: "tr" | "en"): string {
  const [y, m] = ay.split("-").map(Number);
  return new Intl.DateTimeFormat(dil === "en" ? "en-GB" : "tr-TR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, (m || 1) - 1, 1)));
}

/**
 * **Geçmiş** — son 3 ayın çalışma kaydı.
 *
 * Patron isteği (26 Kas 2026): "son 3 ay kaydedilsin, çalışandır çalışma
 * saatidir vs." Kayıtlar zaten silinmiyor; bu ekran son 3 ayı kişi × ay
 * kırılımında özetler. Daha eski veriler arşivde durur (SQL panelinden
 * görülebilir), varsayılan görünüm 3 aydır.
 */
export default async function GecmisPage() {
  await oturumGerekli("/gecmis");
  const dil = dilOku((await cookies()).get(DIL_COOKIE)?.value);
  const business = await ensureBusiness();
  const aylar = sonAylar(3);
  const baslangic = `${aylar[0]}-01`;

  const [personel, sablonlar, atamalar] = await Promise.all([
    prisma.employee.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
    prisma.shiftTemplate.findMany({
      where: { businessId: business.id },
      select: { id: true, start: true, end: true, breakStart: true, breakEnd: true },
    }),
    prisma.assignment.findMany({
      where: { businessId: business.id, date: { gte: baslangic } },
      select: { employeeId: true, date: true, shiftTemplateId: true },
    }),
  ]);

  const sablonById = new Map(sablonlar.map((s) => [s.id, s]));
  type Hucre = { gun: number; saat: number; vardiya: number };
  const tablo = new Map<string, Map<string, Hucre>>();
  for (const p of personel) tablo.set(p.id, new Map());
  const ayToplam = new Map<string, { saat: number; gun: number; kisi: Set<string> }>();
  for (const ay of aylar) ayToplam.set(ay, { saat: 0, gun: 0, kisi: new Set() });

  for (const a of atamalar) {
    const ay = a.date.slice(0, 7);
    const s = sablonById.get(a.shiftTemplateId);
    if (!s) continue;
    const saat = shiftHours(s);
    const kisi = tablo.get(a.employeeId);
    if (kisi) {
      const h = kisi.get(ay) ?? { gun: 0, saat: 0, vardiya: 0 };
      h.gun += 1;
      h.saat += saat;
      h.vardiya += 1;
      kisi.set(ay, h);
    }
    const toplam = ayToplam.get(ay);
    if (toplam) {
      toplam.saat += saat;
      toplam.gun += 1;
      toplam.kisi.add(a.employeeId);
    }
  }

  const toplamSaat = aylar.reduce((top, ay) => top + (ayToplam.get(ay)?.saat ?? 0), 0);
  const toplamVardiya = aylar.reduce((top, ay) => top + (ayToplam.get(ay)?.gun ?? 0), 0);

  return (
    <main className="kap py-5 sm:py-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{t(dil, "hist.records")}</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight">{t(dil, "hist.title")}</h1>
          <p className="mt-1 text-[13px] text-zinc-500">
            {t(dil, "hist.sub", { aylar: aylar.map((a) => ayEtiketi(a, dil)).join(" · ") })}
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/gecmis/csv" className="btn-ikincil h-9 text-[12.5px]">
            {t(dil, "hist.download")}
          </a>
          <Link href="/raporlar" className="btn-sessiz h-9 text-[12.5px]">
            {t(dil, "hist.report")}
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {aylar.map((ay) => {
          const toplamAy = ayToplam.get(ay);
          return (
            <div key={ay} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-[12px] font-medium text-zinc-500">{ayEtiketi(ay, dil)}</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-[24px] font-semibold tracking-tight">{Math.round(toplamAy?.saat ?? 0)}</span>
                <span className="text-[12px] text-zinc-500">{t(dil, "genel.saat")}</span>
              </div>
              <div className="mt-0.5 text-[12px] text-zinc-500">
                {toplamAy?.gun ?? 0} {t(dil, "genel.vardiya")} · {toplamAy?.kisi.size ?? 0} {t(dil, "genel.kisi")}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-[11.5px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
              <th className="px-4 py-2.5 font-semibold">{t(dil, "hist.employee")}</th>
              {aylar.map((ay) => (
                <th key={ay} className="px-3 py-2.5 text-center font-semibold capitalize">
                  {ayEtiketi(ay, dil)}
                </th>
              ))}
              <th className="px-3 py-2.5 text-center font-semibold">{t(dil, "hist.total")}</th>
            </tr>
          </thead>
          <tbody>
            {personel.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  {t(dil, "hist.noStaff")}{" "}
                  <Link href="/panel" className="underline underline-offset-2">
                    {t(dil, "hist.back")}
                  </Link>
                </td>
              </tr>
            ) : (
              personel.map((p) => {
                const satir = tablo.get(p.id);
                let toplam = 0;
                return (
                  <tr key={p.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <th scope="row" className="px-4 py-2.5 text-left font-medium">
                      <div>{p.name}</div>
                      <div className="text-[11px] font-normal text-zinc-500">{p.role}</div>
                    </th>
                    {aylar.map((ay) => {
                      const h = satir?.get(ay);
                      toplam += h?.saat ?? 0;
                      return (
                        <td key={ay} className="px-3 py-2.5 text-center tabular-nums">
                          {h ? (
                            <span>
                              {Math.round(h.saat)} {t(dil, "genel.saat")}
                              <span className="block text-[11px] text-zinc-400">{h.gun} {t(dil, "genel.gun")}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-center font-semibold tabular-nums">
                      {Math.round(toplam)} {t(dil, "genel.saat")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-200 bg-zinc-50 text-[12px] dark:border-zinc-800 dark:bg-zinc-950">
              <th className="px-4 py-2.5 text-left font-semibold">{t(dil, "hist.total")}</th>
              {aylar.map((ay) => (
                <td key={ay} className="px-3 py-2.5 text-center font-semibold tabular-nums">
                  {Math.round(ayToplam.get(ay)?.saat ?? 0)} {t(dil, "genel.saat")}
                </td>
              ))}
              <td className="px-3 py-2.5 text-center font-semibold tabular-nums">{Math.round(toplamSaat)} {t(dil, "genel.saat")}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-zinc-500">
        {t(dil, "hist.foot", { n: toplamVardiya })}
      </p>
    </main>
  );
}
