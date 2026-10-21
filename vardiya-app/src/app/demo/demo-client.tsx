"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { analyzeWeek, DAILY_LIMIT_HOURS, MIN_DAILY_REST_HOURS } from "@/lib/compliance";
import { DAY_SHORT_TR } from "@/lib/dates";
import { DEFAULT_SHIFTS, shiftSaatMetni, WEEKLY_LIMIT_HOURS } from "@/lib/shifts";
import { buildScheduleText } from "@/lib/whatsapp";
import {
  DEMO_GUNLER,
  DEMO_PERSONEL,
  DEMO_SIRA,
  demoAtamaSatirlari,
  demoAtamalari,
  demoKey,
} from "@/lib/demo-data";
import type { ShiftTemplate } from "@/lib/types";

/**
 * Kayıt gerektirmeyen ürün demosu.
 *
 * Kasıtlı olarak sunucuya hiçbir şey yazmaz: tüm değişiklikler yalnızca
 * tarayıcı belleğinde kalır. Amaç, alıcının paneli ve mevzuat uyarılarını
 * hesap açmadan görebilmesi.
 */

const GUNLER = DEMO_GUNLER;

const HAFTA: Date[] = GUNLER.map((g) => {
  const [y, m, d] = g.iso.split("-").map(Number);
  return new Date(y, m - 1, d);
});

const PERSONEL = DEMO_PERSONEL;
const SIRA = DEMO_SIRA;

const RENK: Record<string, { hucre: string; nokta: string }> = {
  sabah: {
    hucre: "border-amber-300 bg-amber-100 text-amber-900",
    nokta: "bg-amber-500",
  },
  aksam: {
    hucre: "border-violet-300 bg-violet-100 text-violet-800",
    nokta: "bg-violet-500",
  },
  tamgun: {
    hucre: "border-rose-300 bg-rose-100 text-rose-800",
    nokta: "bg-rose-500",
  },
  ara: {
    hucre: "border-cyan-300 bg-cyan-100 text-cyan-800",
    nokta: "bg-cyan-600",
  },
};

const keyOf = demoKey;
const baslangicAtamalari = demoAtamalari;
const toAssignmentRows = demoAtamaSatirlari;

export default function DemoClient() {
  const [atama, setAtama] = useState<Record<string, string>>(baslangicAtamalari);
  const [mesajKisi, setMesajKisi] = useState("p1");

  const satirlar = useMemo(() => toAssignmentRows(atama), [atama]);
  const analiz = useMemo(
    () =>
      analyzeWeek({
        employees: PERSONEL,
        shifts: DEFAULT_SHIFTS,
        assignments: satirlar,
        weekDates: GUNLER.map((g) => g.iso),
      }),
    [satirlar]
  );

  const toplamVardiya = satirlar.length;
  const toplamSaat = [...analiz.perEmployee.values()].reduce((s, e) => s + e.weeklyHours, 0);
  const calisan = PERSONEL.filter(
    (p) => (analiz.perEmployee.get(p.id)?.weeklyHours ?? 0) > 0
  ).length;

  function hucreDegistir(employeeId: string, iso: string) {
    const k = keyOf(employeeId, iso);
    const mevcut = atama[k];
    const sonraki =
      mevcut === undefined
        ? SIRA[0]
        : SIRA[(SIRA.indexOf(mevcut as (typeof SIRA)[number]) + 1) % SIRA.length];
    setAtama((eski) => {
      const yeni = { ...eski };
      // Son adımdan sonra hücreyi boşalt.
      if (mevcut === SIRA[SIRA.length - 1]) delete yeni[k];
      else yeni[k] = sonraki;
      return yeni;
    });
  }

  const mesaj = buildScheduleText(
    PERSONEL.find((p) => p.id === mesajKisi) ?? PERSONEL[0],
    HAFTA,
    atama,
    DEFAULT_SHIFTS as ShiftTemplate[],
    "Kahve Durağı"
  );

  return (
    <main className="flex-1">
      <section className="bolum-gri border-b border-zinc-200">
        <div className="kap py-10 sm:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Kayıt gerekmez · değişiklikler kaydedilmez
            </span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-zinc-900 sm:text-5xl">
              Vardiya&apos;yı açmadan dene.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-600">
              Bu, gerçek panelin örnek verili hâli. Hücrelere tıklayarak vardiya
              değiştir; toplam saatler, haftalık 45 saat, günlük{" "}
              {DAILY_LIMIT_HOURS} saat ve {MIN_DAILY_REST_HOURS} saat dinlenme
              uyarıları anında güncellenir.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link href="/kayit" className="btn-cta h-11 px-6">
                Kendi hesabımı aç <span aria-hidden>→</span>
              </Link>
              <Link href="/" className="btn-ghost h-11 px-6">
                Ana sayfaya dön
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="kap py-8 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
              Örnek işletme
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-900">
              Kahve Durağı
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              19 – 25 Ekim 2026 · 7 gün · {PERSONEL.length} personel
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="cip">
              <strong className="text-zinc-900">{toplamVardiya}</strong> vardiya
            </span>
            <span className="cip">
              <strong className="text-zinc-900">{toplamSaat}</strong> saat
            </span>
            <span className="cip">
              <strong className="text-zinc-900">
                {calisan}/{PERSONEL.length}
              </strong>{" "}
              kişi çalışıyor
            </span>
            <span
              className={`cip ${
                analiz.issues.length > 0
                  ? "border-amber-300 bg-amber-50 text-amber-900"
                  : "border-emerald-300 bg-emerald-50 text-emerald-800"
              }`}
            >
              {analiz.issues.length > 0
                ? `${analiz.issues.length} uyarı`
                : "✓ uyarı yok"}
            </span>
          </div>
        </div>

        <div className="kart mt-5 overflow-hidden">
          <div className="kart-baslik flex-wrap gap-2">
            <div>
              <h3 className="bolum-baslik">Haftalık plan</h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                Hücreye tıkla → sıradaki vardiya. Son adımda hücre boşalır.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAtama({})}
                className="btn-ghost btn-kucuk"
              >
                Haftayı boşalt
              </button>
              <button
                type="button"
                onClick={() => setAtama(baslangicAtamalari())}
                className="btn-ikincil btn-kucuk"
              >
                Örneğe dön
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-500">
                  <th className="sticky left-0 z-10 bg-white px-4 py-2.5 text-left text-xs font-semibold">
                    Personel
                  </th>
                  {GUNLER.map((g) => (
                    <th key={g.iso} className="px-1.5 py-2 text-center text-xs font-semibold">
                      <span className="block text-zinc-700">{g.ad}</span>
                      <span className="mt-0.5 block text-[10px] font-normal text-zinc-400">
                        {g.tarih}
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-right text-xs font-semibold">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {PERSONEL.map((p) => {
                  const sonuc = analiz.perEmployee.get(p.id);
                  return (
                    <tr key={p.id} className="border-b border-zinc-50 last:border-0">
                      <th
                        scope="row"
                        className="sticky left-0 z-10 bg-white px-4 py-2 text-left font-normal"
                      >
                        <span className="block text-[13px] font-semibold text-zinc-900">
                          {p.name}
                        </span>
                        <span className="block text-[11px] text-zinc-500">{p.role}</span>
                      </th>
                      {GUNLER.map((g) => {
                        const shiftId = atama[keyOf(p.id, g.iso)];
                        const shift = DEFAULT_SHIFTS.find((s) => s.id === shiftId);
                        const renk = shiftId ? RENK[shiftId] : undefined;
                        return (
                          <td key={g.iso} className="px-1 py-1.5 align-middle">
                            <button
                              type="button"
                              onClick={() => hucreDegistir(p.id, g.iso)}
                              aria-label={`${p.name}, ${g.ad} ${g.tarih}: ${
                                shift ? shift.name : "boş"
                              }. Değiştirmek için tıkla.`}
                              className={`flex min-h-9 w-full items-center justify-center gap-1 rounded-md border px-1 py-1 text-[11px] font-medium transition-colors ${
                                renk
                                  ? renk.hucre
                                  : "border-dashed border-zinc-200 text-zinc-300 hover:border-amber-300 hover:text-amber-600"
                              }`}
                            >
                              {shift ? shift.name : "+"}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right text-xs">
                        <span
                          className={`font-semibold ${
                            (sonuc?.overtimeHours ?? 0) > 0
                              ? "text-amber-700"
                              : "text-zinc-800"
                          }`}
                        >
                          {sonuc?.weeklyHours ?? 0} sa
                        </span>
                        {(sonuc?.overtimeHours ?? 0) > 0 ? (
                          <span className="block text-[10px] text-amber-700">
                            {WEEKLY_LIMIT_HOURS} sa üstü
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-100 px-4 py-3 text-[11px] text-zinc-500">
            {DEFAULT_SHIFTS.map((s) => (
              <span key={s.id} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${RENK[s.id]?.nokta ?? "bg-zinc-300"}`} />
                {s.name} · {shiftSaatMetni(s)}
              </span>
            ))}
            <span className="ml-auto">Mobilde tabloyu yatay kaydır.</span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <section className="kart p-5">
            <h3 className="text-sm font-bold text-zinc-900">
              Mevzuat uyarıları {analiz.issues.length > 0 ? `(${analiz.issues.length})` : ""}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Örnekte bilerek iki uyarı var: Elif, akşam kapanışından sonra ertesi
              sabah açılışta (dinlenme 8 saat); Mehmet ise haftada 48 saat çalışıyor
              (45 saat sınırı). Hücreleri değiştirerek uyarıların nasıl
              güncellendiğini görebilirsin.
            </p>
            {analiz.issues.length === 0 ? (
              <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                ✓ Bu planda süre/dinlenme uyarısı yok.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {analiz.issues.slice(0, 4).map((i, idx) => (
                  <li
                    key={`${i.employeeId}-${i.date}-${idx}`}
                    className={`rounded-xl border px-3 py-2 text-[13px] ${
                      i.severity === "error"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-amber-200 bg-amber-50 text-amber-900"
                    }`}
                  >
                    <strong className="font-semibold">
                      {PERSONEL.find((p) => p.id === i.employeeId)?.name}
                    </strong>
                    : {i.message}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
              Vardiya bir planlama aracıdır; uyarılar hukuki danışmanlık değildir.
              Mevzuatın uygulanmasından işveren sorumludur.
            </p>
          </section>

          <section className="kart p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-zinc-900">WhatsApp mesajı önizleme</h3>
              <select
                value={mesajKisi}
                onChange={(e) => setMesajKisi(e.target.value)}
                aria-label="Mesajı gösterilecek personel"
                className="giris h-8 w-36 py-1 text-xs"
              >
                {PERSONEL.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-zinc-950 p-4 text-[12px] leading-relaxed text-zinc-100">
              {mesaj}
            </pre>
            <p className="mt-2 text-[11px] text-zinc-500">
              Gerçek panelde bu metin her personel için ayrı hazırlanır ve tek tıkla
              WhatsApp&apos;ta açılır. 15 kişilik ekipte 15 kez açılır; otomatik toplu
              gönderim yoktur. Personel giriş yapmadan da kendi programını görür.
            </p>
          </section>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">Bu demo, yaptığın değişiklikleri kaydetmez.</p>
          <p className="mt-1 text-[13px] leading-relaxed">
            Gerçek hesabında personelini ekler, haftayı doldurur ve her kişiye hazır
            mesajı WhatsApp&apos;ta açarsın. Ücretsiz; kredi kartı istenmez.
          </p>
          <Link href="/kayit" className="btn-cta mt-4 h-11 px-6">
            Ücretsiz başla <span aria-hidden>→</span>
          </Link>
        </div>

        <p className="mt-4 text-center text-[11px] text-zinc-400">
          Örnek hafta: 19–25 Ekim 2026 · {DAY_SHORT_TR.join(" · ")}
        </p>
      </section>
    </main>
  );
}
