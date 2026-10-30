"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import type { EkipPayload } from "@/lib/ekip";
import { DAY_NAMES_TR, formatShort, formatWeekRange, getWeekDates, toISODate } from "@/lib/dates";
import { shiftHours, shiftSaatMetni, WEEKLY_LIMIT_HOURS } from "@/lib/shifts";
import { COLOR_CLASSES } from "@/lib/colors";
import { getHoliday } from "@/lib/holidays";
import {
  IZIN_DURUM_ETIKETI,
  IZIN_TUR_ETIKETI,
  IZIN_TURLERI,
  izinTarihMetni,
} from "@/lib/izin";
import type { IzinTuru } from "@/lib/types";

/** Durum rozetlerinin renkleri (amber = bekliyor, yeşil = onaylı). */
const DURUM_SINIFI: Record<string, string> = {
  bekliyor: "border-amber-200 bg-amber-50 text-amber-900",
  onaylandi: "border-emerald-200 bg-emerald-50 text-emerald-800",
  reddedildi: "border-zinc-200 bg-zinc-50 text-zinc-600",
  iptal: "border-zinc-200 bg-zinc-50 text-zinc-500",
};

/**
 * Personelin kendi programı — yalnızca görüntüleme.
 * Veri sunucudan hazır gelir; bu bileşen yalnızca hafta gezinmesi yapar.
 */
export default function EkipDetayClient({ veri }: { veri: EkipPayload }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const shiftById = useMemo(() => {
    const m = new Map(veri.shiftTemplates.map((t) => [t.id, t]));
    return m;
  }, [veri.shiftTemplates]);

  const assignByDate = useMemo(
    () => new Map(veri.assignments.map((a) => [a.date, a.shiftTemplateId])),
    [veri.assignments]
  );

  const todayISO = toISODate(new Date());

  /**
   * İzin/mazeret talebi — personel imzalı bağlantısından gönderir.
   * Liste sunucudan hazır gelir; yeni talep gönderilince yerinde güncellenir.
   */
  const [izinListe, setIzinListe] = useState(veri.izinTalepleri);
  const [izinForm, setIzinForm] = useState({
    tur: "izin" as IzinTuru,
    baslangic: todayISO,
    bitis: todayISO,
    not: "",
  });
  const [izinBusy, setIzinBusy] = useState(false);
  const [izinHata, setIzinHata] = useState("");
  const [izinBasari, setIzinBasari] = useState("");

  async function izinGonder(e: FormEvent) {
    e.preventDefault();
    if (izinBusy) return;
    setIzinBusy(true);
    setIzinHata("");
    setIzinBasari("");
    try {
      const res = await fetch(`/api/ekip/${veri.token}/izin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(izinForm),
      });
      const sonuc = (await res.json().catch(() => ({}))) as {
        hata?: string;
        talep?: (typeof izinListe)[number];
        talepler?: typeof izinListe;
      };
      if (!res.ok) {
        setIzinHata(sonuc.hata || "Talep gönderilemedi. Lütfen tekrar dene.");
        return;
      }
      setIzinListe(
        sonuc.talepler ?? (sonuc.talep ? [sonuc.talep, ...izinListe] : izinListe),
      );
      setIzinBasari("Talebin işletmeye iletildi. Onaylandığında burada görünecek.");
      setIzinForm((f) => ({ ...f, not: "" }));
    } catch {
      setIzinHata("Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.");
    } finally {
      setIzinBusy(false);
    }
  }

  const total = weekDates.reduce((sum, d) => {
    const sid = assignByDate.get(toISODate(d));
    const t = sid ? shiftById.get(sid) : undefined;
    return sum + (t ? shiftHours(t) : 0);
  }, 0);
  const overtime = Math.round(Math.max(0, total - WEEKLY_LIMIT_HOURS) * 10) / 10;

  return (
    <main className="sayfa max-w-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Vardiya programı
          </p>
          <div className="mt-1 flex items-center gap-2.5">
            <span
              className={`h-3 w-3 shrink-0 rounded-full ${
                COLOR_CLASSES[veri.employee.color]?.dot ?? "bg-zinc-400"
              }`}
            />
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
              {veri.employee.name}
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {veri.employee.role || "Görev belirtilmemiş"} · {veri.businessName}
          </p>
        </div>
        <Link href="/" className="btn-ikincil btn-kucuk shrink-0">
          Vardiya
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
        <span>
          Yıllık izin hakkı:{" "}
          <strong className="text-zinc-800">{veri.employee.annualLeaveDays} gün</strong>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
          Salt-okunur
        </span>
      </div>

      {veri.taslakHaftaVar && (
        <p className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          Yeni bir plan hazırlanıyor; yayınlanınca burada görünecek.
        </p>
      )}

      {veri.announcements.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
            Duyurular
          </div>
          <ul className="mt-1.5 space-y-1">
            {veri.announcements.slice(0, 3).map((a) => (
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
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-[11px] text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
            >
              Bu haftaya dön
            </button>
          )}
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
          const shiftId = assignByDate.get(iso);
          const t = shiftId ? shiftById.get(shiftId) : undefined;
          const dayName = DAY_NAMES_TR[(d.getDay() + 6) % 7];
          const holiday = getHoliday(iso);
          const bugun = iso === todayISO;
          return (
            <li
              key={iso}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${
                bugun ? "bg-amber-50/60" : ""
              }`}
            >
              <span className="text-sm text-zinc-600">
                {dayName} <span className="text-zinc-400">{formatShort(d)}</span>
                {bugun && (
                  <span className="ml-2 rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    bugün
                  </span>
                )}
                {holiday && (
                  <span
                    className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle"
                    title={holiday.name}
                  />
                )}
              </span>
              {t ? (
                <span
                  className={`rounded-lg border px-2.5 py-1 text-xs ${
                    COLOR_CLASSES[t.color]?.chip ?? ""
                  }`}
                >
                  {t.name} · {shiftSaatMetni(t)}
                </span>
              ) : (
                <span className="text-xs text-zinc-400">İzin / boş</span>
              )}
            </li>
          );
        })}
      </ul>

      <a href={`/api/calendar/${veri.token}`} className="btn-ikincil mt-5">
        Telefon takvimine ekle (.ics)
      </a>

      {/* İzin / mazeret talebi */}
      <section className="kart mt-5 p-4" aria-labelledby="izin-baslik">
        <h2 id="izin-baslik" className="text-base font-semibold">
          İzin / mazeret talebi
        </h2>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
          Talebin işletme yöneticisine gider; onaylandığında burada görünür. Rapor
          için belge istenmez — kısa bir not yeterli.
        </p>

        <form onSubmit={izinGonder} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-zinc-600">
            <span className="etiket">Tür</span>
            <select
              value={izinForm.tur}
              onChange={(e) =>
                setIzinForm({ ...izinForm, tur: e.target.value as IzinTuru })
              }
              className="giris mt-1"
              aria-label="Talep türü"
            >
              {IZIN_TURLERI.map((t) => (
                <option key={t} value={t}>
                  {IZIN_TUR_ETIKETI[t]}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-zinc-600">
              <span className="etiket">Başlangıç</span>
              <input
                type="date"
                value={izinForm.baslangic}
                onChange={(e) =>
                  setIzinForm({ ...izinForm, baslangic: e.target.value })
                }
                className="giris mt-1"
                required
              />
            </label>
            <label className="text-xs text-zinc-600">
              <span className="etiket">Bitiş</span>
              <input
                type="date"
                value={izinForm.bitis}
                min={izinForm.baslangic}
                onChange={(e) => setIzinForm({ ...izinForm, bitis: e.target.value })}
                className="giris mt-1"
                required
              />
            </label>
          </div>

          <label className="text-xs text-zinc-600 sm:col-span-2">
            <span className="etiket">Not (isteğe bağlı)</span>
            <textarea
              value={izinForm.not}
              onChange={(e) => setIzinForm({ ...izinForm, not: e.target.value })}
              maxLength={500}
              rows={2}
              placeholder="Ör. Cumartesi günü ailemle ilgili bir durum var."
              className="giris mt-1"
            />
          </label>

          {izinHata && (
            <p role="alert" className="text-xs text-red-600 sm:col-span-2">
              {izinHata}
            </p>
          )}
          {izinBasari && (
            <p role="status" className="text-xs text-emerald-700 sm:col-span-2">
              {izinBasari}
            </p>
          )}

          <div className="sm:col-span-2">
            <button type="submit" disabled={izinBusy} className="btn-birincil disabled:opacity-60">
              {izinBusy ? "Gönderiliyor…" : "Talep gönder"}
            </button>
          </div>
        </form>

        {izinListe.length > 0 && (
          <div className="mt-4 border-t border-zinc-100 pt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Taleplerim
            </h3>
            <ul className="mt-2 space-y-1.5">
              {izinListe.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                >
                  <span className="min-w-0">
                    <span className="font-medium text-zinc-800">
                      {izinTarihMetni(t.baslangic, t.bitis)}
                    </span>
                    <span className="text-zinc-500"> · {IZIN_TUR_ETIKETI[t.tur]}</span>
                    {t.not ? (
                      <span className="block truncate text-[11px] text-zinc-500">{t.not}</span>
                    ) : null}
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      DURUM_SINIFI[t.durum] ?? "border-zinc-200 bg-white text-zinc-600"
                    }`}
                  >
                    {IZIN_DURUM_ETIKETI[t.durum]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <p className="mt-6 text-xs leading-relaxed text-zinc-400">
        Program yalnızca görüntülenir; değişiklik ve izin onayı işletme yöneticisinde.
        Bu bağlantıyı bilen herkes programı görebilir — kişisel bir bağlantıdır,
        herkese açık yerde paylaşma.
      </p>
    </main>
  );
}
