"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/Modal";
import TemplateManager from "@/components/TemplateManager";
import {
  addEmployee,
  addIzin,
  clearWeek,
  copyWeek,
  createAnnouncement,
  decideIzin,
  deleteAnnouncement,
  deleteEmployee,
  fetchState,
  okunduOzeti,
  publishWeek,
  resetData,
  setAssignment,
  unpublishWeek,
  updateBusiness,
  updateEmployee,
} from "@/lib/api-client";
import { COLOR_CLASSES } from "@/lib/colors";
import { analyzeWeek } from "@/lib/compliance";
import {
  DAY_SHORT_TR,
  formatDayDate,
  formatWeekRange,
  getWeekDates,
  haftaBasiISO,
  istanbulGunu,
  toISODate,
} from "@/lib/dates";
import { onayliIzinVarMi } from "@/lib/izin";
import { shiftHours, shiftSaatMetni } from "@/lib/shifts";
import type { Employee, IzinTalebi, ShiftTemplate, StatePayload } from "@/lib/types";
import type { OkunduYaniti } from "@/lib/okundu";
import { isoHaftaBasi } from "@/lib/yayin";
import { buildScheduleText, buildWhatsAppLink } from "@/lib/whatsapp";

/**
 * Panel — **sade sürüm**.
 *
 * Tasarım kararı (24 Kas 2026): ekranın tek işi var: bu hafta **kim, hangi gün,
 * hangi vardiyada**. Bu yüzden üstte hafta çubuğu, ortada tek ızgara, altta tek
 * satır özet. Ekip, izin, duyuru, şablon, paylaşım gibi ikincil işler "Araçlar"
 * penceresinde toplanır; ana ekranı kalabalıklaştırmaz.
 *
 * İleri tarihli plan: hafta okları + **tarih seçici** ile 1 yıl ileriye kadar
 * gidilebilir. Her hafta ayrı yayınlanır (taslak → yayınla).
 */
type Secim = { employeeId: string; iso: string };
type ModalTuru =
  | null
  | "ekip"
  | "izin"
  | "duyuru"
  | "sablon"
  | "paylas"
  | "okundu"
  | "araclar"
  | "saatler"
  | "rapor"
  | "uyarilar";
type Duzenlenen = { id: string; name: string; role: string; phone: string } | null;

const BUGUN = istanbulGunu();

export default function PanelClient({
  initialData,
  eposta,
  epostaDogrulanmis = true,
  ziyaret,
}: {
  initialData: StatePayload;
  eposta?: string;
  epostaDogrulanmis?: boolean;
  ziyaret?: { bugun: number; hafta: number; ay: number };
}) {
  const [data, setData] = useState<StatePayload>(initialData);
  const [offset, setOffset] = useState(0);
  const [secim, setSecim] = useState<Secim | null>(null);
  const [modal, setModal] = useState<ModalTuru>(null);
  const [duzenlenen, setDuzenlenen] = useState<Duzenlenen>(null);
  const [kayit, setKayit] = useState<"bos" | "yaziyor" | "tamam">("bos");
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [degisenHafta, setDegisenHafta] = useState<string | null>(null);
  const [yayinBusy, setYayinBusy] = useState(false);
  const [mobilGun, setMobilGun] = useState<number | null>(null);
  const [okundu, setOkundu] = useState<OkunduYaniti | null>(null);
  const [tarihGirdi, setTarihGirdi] = useState("");
  const zaman = useRef<number | null>(null);

  const haftalar = useMemo(() => getWeekDates(offset), [offset]);
  const gunler = useMemo(() => haftalar.map((d) => toISODate(d)), [haftalar]);
  const haftaISO = gunler[0];
  const yayinda = (data.publishedWeeks ?? []).includes(haftaISO);
  const degisti = degisenHafta === haftaISO;

  const sablonlar = data.shiftTemplates;
  const personel = data.employees;
  const sablonById = useMemo(() => new Map(sablonlar.map((s) => [s.id, s])), [sablonlar]);
  const atamaMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of data.assignments) m.set(`${a.employeeId}__${a.date}`, a.shiftTemplateId);
    return m;
  }, [data.assignments]);

  const onayliIzinler = useMemo(
    () => (data.izinTalepleri ?? []).filter((t) => t.durum === "onaylandi"),
    [data.izinTalepleri],
  );
  const bekleyenIzinler = useMemo(
    () => (data.izinTalepleri ?? []).filter((t) => t.durum === "bekliyor"),
    [data.izinTalepleri],
  );
  const izinliMi = useCallback(
    (empId: string, iso: string) => onayliIzinVarMi(onayliIzinler, empId, iso),
    [onayliIzinler],
  );

  /** Mevzuat uyarıları (45 saat, 11 saat dinlenme, günlük 11 saat, gece...) */
  const analiz = useMemo(
    () =>
      analyzeWeek({
        employees: personel.map((e) => ({ id: e.id, name: e.name })),
        shifts: sablonlar,
        assignments: data.assignments,
        weekDates: gunler,
        previousDate: toISODate(new Date(new Date(`${gunler[0]}T12:00:00`).getTime() - 86_400_000)),
      }),
    [personel, sablonlar, data.assignments, gunler],
  );

  const haftaAtama = useMemo(
    () => data.assignments.filter((a) => gunler.includes(a.date)).length,
    [data.assignments, gunler],
  );
  const haftaSaat = useMemo(
    () =>
      data.assignments
        .filter((a) => gunler.includes(a.date))
        .reduce((toplam, a) => toplam + (sablonById.get(a.shiftTemplateId) ? shiftHours(sablonById.get(a.shiftTemplateId)!) : 0), 0),
    [data.assignments, gunler, sablonById],
  );
  const calisanKisi = useMemo(
    () => new Set(data.assignments.filter((a) => gunler.includes(a.date)).map((a) => a.employeeId)).size,
    [data.assignments, gunler],
  );

  const uyariVar = analiz.issues.length > 0;

  function bildir(metin: string) {
    setMesaj(metin);
    if (zaman.current) window.clearTimeout(zaman.current);
    zaman.current = window.setTimeout(() => setMesaj(null), 3200);
  }

  const yukle = useCallback(async () => {
    try {
      setData(await fetchState());
    } catch {
      bildir("Veriler yenilenemedi. Sayfayı yenile.");
    }
  }, []);

  async function atamaYaz(employeeId: string, iso: string, sablonId: string) {
    setData((onceki) => {
      const digerleri = onceki.assignments.filter((a) => !(a.employeeId === employeeId && a.date === iso));
      return {
        ...onceki,
        assignments: sablonId
          ? [...digerleri, { employeeId, date: iso, shiftTemplateId: sablonId }]
          : digerleri,
      };
    });
    setKayit("yaziyor");
    try {
      await setAssignment(employeeId, iso, sablonId);
      setKayit("tamam");
      if (yayinda) setDegisenHafta(haftaISO);
      window.setTimeout(() => setKayit("bos"), 1600);
    } catch {
      setKayit("bos");
      bildir("Kaydedilemedi. Tekrar dene.");
      await yukle();
    }
  }

  async function yayinla() {
    if (haftaAtama === 0) {
      bildir("Bu haftada vardiya yok — önce planı doldur.");
      return;
    }
    setYayinBusy(true);
    try {
      await publishWeek(haftaISO);
      setDegisenHafta(null);
      await yukle();
      bildir("Plan yayınlandı — ekip görebilir.");
    } catch {
      bildir("Yayınlanamadı. Tekrar dene.");
    } finally {
      setYayinBusy(false);
    }
  }

  async function yayiniGeriAl() {
    setYayinBusy(true);
    try {
      await unpublishWeek(haftaISO);
      await yukle();
      bildir("Yayın geri alındı — hafta yeniden taslak.");
    } catch {
      bildir("Yayın geri alınamadı.");
    } finally {
      setYayinBusy(false);
    }
  }

  function tariheGit(iso: string) {
    const pzt = isoHaftaBasi(iso);
    if (!pzt) return;
    const buPzt = haftaBasiISO();
    const fark = Math.round(
      (Date.parse(`${pzt}T00:00:00Z`) - Date.parse(`${buPzt}T00:00:00Z`)) / 604_800_000,
    );
    if (!Number.isFinite(fark)) return;
    setOffset(Math.max(-104, Math.min(104, fark)));
    setTarihGirdi("");
  }

  // Sekme/başlık açıklaması: bugün hangi gün hangi vardiyalar var.
  const bugunVardiyalar = useMemo(() => {
    const gruplar = new Map<string, string[]>();
    for (const a of data.assignments) {
      if (a.date !== BUGUN) continue;
      const s = sablonById.get(a.shiftTemplateId);
      const e = personel.find((p) => p.id === a.employeeId);
      if (!s || !e) continue;
      const dizi = gruplar.get(s.id) ?? [];
      dizi.push(e.name);
      gruplar.set(s.id, dizi);
    }
    return gruplar;
  }, [data.assignments, sablonById, personel]);

  const buHaftaMi = offset === 0;
  const bugunIndex = gunler.indexOf(BUGUN);
  const seciliGun = mobilGun ?? (bugunIndex >= 0 ? bugunIndex : 0);

  const OFSET_SINIRI = 104; // 2 yıl ileri/geri — yanlış tıklamada kaybolmayı önler
  const ofsetDegistir = (fark: number) =>
    setOffset((o) => Math.max(-OFSET_SINIRI, Math.min(OFSET_SINIRI, o + fark)));

  return (
    <main className="kap py-5 sm:py-7">
      {/* Bildirim */}
      {mesaj ? (
        <div
          role="status"
          className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-md rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[13px] text-zinc-800 shadow-lg sm:bottom-5 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {mesaj}
        </div>
      ) : null}

      {!epostaDogrulanmis ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          <span>
            E-posta adresin doğrulanmadı
            {eposta ? ` (${eposta})` : ""}. Şifre sıfırlama ve şifresiz giriş için gerekli.
          </span>
          <Link href="/eposta-dogrula" className="font-semibold underline underline-offset-2">
            Doğrula →
          </Link>
        </div>
      ) : null}

      {/* Hafta çubuğu */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => ofsetDegistir(-1)}
            className="btn-sessiz h-9 w-9 !px-0 text-base"
            aria-label="Önceki hafta"
          >
            ‹
          </button>
          <div className="min-w-[168px] text-center">
            <div className="text-[15px] font-semibold tracking-tight">{formatWeekRange(haftalar)}</div>
            <div className="text-[11px] text-zinc-500">
              {offset === 0 ? "Bu hafta" : offset > 0 ? `${offset} hafta sonra` : `${-offset} hafta önce`}
              {kayit === "yaziyor" ? " · kaydediliyor…" : kayit === "tamam" ? " · kaydedildi" : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={() => ofsetDegistir(1)}
            className="btn-sessiz h-9 w-9 !px-0 text-base"
            aria-label="Sonraki hafta"
          >
            ›
          </button>
          {offset !== 0 ? (
            <button
              type="button"
              onClick={() => setOffset(0)}
              className="btn-sessiz h-9 text-[12px]"
            >
              Bu hafta
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="tarih-git">
            Tarihe git
          </label>
          <input
            id="tarih-git"
            type="date"
            value={tarihGirdi}
            onChange={(e) => {
              setTarihGirdi(e.target.value);
              if (e.target.value) tariheGit(e.target.value);
            }}
            className="giris h-9 w-[150px] !py-0 text-[12.5px]"
          />
          <span
            className={`inline-flex h-7 items-center rounded-full px-2.5 text-[11.5px] font-medium ${
              yayinda
                ? "bg-emerald-50 text-emerald-700"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {yayinda ? (degisti ? "Yayında · yeni değişiklik" : "Yayında") : "Taslak"}
          </span>
          {yayinda ? (
            <button
              type="button"
              onClick={() => void yayiniGeriAl()}
              disabled={yayinBusy}
              className="btn-sessiz h-9 text-[12px] disabled:opacity-50"
            >
              Geri al
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void yayinla()}
            disabled={yayinBusy || haftaAtama === 0}
            title={haftaAtama === 0 ? "Önce bu haftaya vardiya ekle" : undefined}
            className="btn-birincil h-9 text-[12.5px] disabled:opacity-50"
          >
            {yayinda && !degisti ? "Yeniden yayınla" : "Planı yayınla"}
          </button>
          <button
            type="button"
            onClick={() => setModal("araclar")}
            className="btn-sessiz h-9 text-[12px]"
          >
            ⋯ Araçlar
          </button>
        </div>
      </div>

      {/* Bugün şeridi */}
      {buHaftaMi ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-[12.5px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Bugün</span>
          {bugunVardiyalar.size === 0 ? (
            <span className="text-zinc-500">Bugün için vardiya yok.</span>
          ) : (
            [...bugunVardiyalar.entries()].map(([sablonId, isimler]) => {
              const s = sablonById.get(sablonId);
              if (!s) return null;
              return (
                <span key={sablonId} className="inline-flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${COLOR_CLASSES[s.color].dot}`} aria-hidden />
                  <strong className="font-medium">{s.name}:</strong> {isimler.join(", ")}
                </span>
              );
            })
          )}
        </div>
      ) : null}

      {/* Masaüstü ızgara */}
      <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:block">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="border-b border-zinc-200 text-[11.5px] text-zinc-500 dark:border-zinc-800">
              <th className="sticky left-0 z-10 bg-white px-3 py-2.5 font-semibold dark:bg-zinc-900">
                Personel
              </th>
              {haftalar.map((d, i) => (
                <th
                  key={gunler[i]}
                  className={`px-2 py-2.5 text-center font-semibold ${
                    gunler[i] === BUGUN ? "text-amber-700" : ""
                  }`}
                >
                  {DAY_SHORT_TR[i]}
                  <span className="ml-1 font-normal text-zinc-400">{d.getDate()}</span>
                </th>
              ))}
              <th className="px-2 py-2.5 text-center font-semibold">Saat</th>
            </tr>
          </thead>
          <tbody>
            {personel.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-[13px] text-zinc-500">
                  Henüz personel yok.{" "}
                  <button type="button" onClick={() => setModal("ekip")} className="underline underline-offset-2">
                    Ekip ekle
                  </button>
                </td>
              </tr>
            ) : (
              personel.map((emp) => {
                const saat = analiz.perEmployee.get(emp.id)?.weeklyHours ?? 0;
                const kisilerUyari = analiz.issues.filter((u) => u.employeeId === emp.id);
                return (
                  <tr key={emp.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-medium dark:bg-zinc-900">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${COLOR_CLASSES[emp.color]?.dot ?? "bg-zinc-400"}`}
                          aria-hidden
                        />
                        <span className="text-[13px]">{emp.name}</span>
                        {kisilerUyari.length ? (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
                            title={`${kisilerUyari.length} uyarı`}
                          />
                        ) : null}
                      </div>
                      <div className="pl-4 text-[11px] font-normal text-zinc-500">{emp.role}</div>
                    </th>
                    {gunler.map((iso) => {
                      const sablonId = atamaMap.get(`${emp.id}__${iso}`);
                      const sablon = sablonId ? sablonById.get(sablonId) : undefined;
                      const izin = izinliMi(emp.id, iso);
                      return (
                        <td key={iso} className="px-1.5 py-2 align-middle">
                          <Hucre
                            sablon={sablon}
                            izin={izin}
                            bugun={iso === BUGUN}
                            onClick={() => setSecim({ employeeId: emp.id, iso })}
                            etiket={`${emp.name} · ${formatDayDate(new Date(`${iso}T12:00:00`))}`}
                          />
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-center text-[12px] tabular-nums">
                      <span className={saat > 45 ? "font-semibold text-red-600" : "text-zinc-600"}>
                        {saat % 1 === 0 ? saat : saat.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobil ajanda */}
      <div className="mt-4 sm:hidden">
        <div className="grid grid-cols-7 gap-1">
          {haftalar.map((d, i) => (
            <button
              key={gunler[i]}
              type="button"
              onClick={() => setMobilGun(i)}
              className={`rounded-lg py-2 text-center text-[11.5px] ${
                seciliGun === i
                  ? "bg-zinc-900 text-white"
                  : gunler[i] === BUGUN
                    ? "bg-amber-50 text-amber-900"
                    : "bg-zinc-100 text-zinc-600"
              }`}
            >
              <span className="block font-semibold">{DAY_SHORT_TR[i]}</span>
              <span className="block">{d.getDate()}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          {personel.length === 0 ? (
            <p className="rounded-xl border border-zinc-200 px-4 py-6 text-center text-[13px] text-zinc-500">
              Henüz personel yok.
            </p>
          ) : (
            personel.map((emp) => {
              const iso = gunler[seciliGun];
              const sablonId = atamaMap.get(`${emp.id}__${iso}`);
              const sablon = sablonId ? sablonById.get(sablonId) : undefined;
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setSecim({ employeeId: emp.id, iso })}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${COLOR_CLASSES[emp.color]?.dot ?? "bg-zinc-400"}`} aria-hidden />
                    <span className="truncate text-[13px] font-medium">{emp.name}</span>
                  </span>
                  {izinliMi(emp.id, iso) ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-900">İzinli</span>
                  ) : sablon ? (
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${COLOR_CLASSES[sablon.color].chip}`}>
                      {sablon.name} · {shiftSaatMetni(sablon)}
                    </span>
                  ) : (
                    <span className="text-[12px] text-zinc-400">+ Vardiya</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Özet + uyarılar */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-zinc-600 dark:text-zinc-300">
        <span>
          <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{haftaAtama}</strong>{" "}
          vardiya
        </span>
        <span>
          <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
            {haftaSaat % 1 === 0 ? haftaSaat : haftaSaat.toFixed(1)}
          </strong>{" "}
          saat
        </span>
        <span>
          <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{calisanKisi}</strong>/
          {personel.length} kişi
        </span>
        {uyariVar ? (
          <button
            type="button"
            onClick={() => setModal("uyarilar")}
            className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[12px] font-medium text-red-700"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
            {analiz.issues.length} uyarı
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            Uyarı yok
          </span>
        )}
        {yayinda ? null : <span className="text-zinc-500">Bu hafta taslak — ekip görmüyor.</span>}
      </div>

      {/* ---------------- Modallar ---------------- */}
      <Modal acik={secim !== null} kapat={() => setSecim(null)} baslik="Vardiya seç" genislik="max-w-lg">
        {secim ? (
          <VardiyaSecici
            emp={personel.find((p) => p.id === secim.employeeId) ?? null}
            iso={secim.iso}
            sablonlar={sablonlar}
            secili={atamaMap.get(`${secim.employeeId}__${secim.iso}`) ?? ""}
            izin={izinliMi(secim.employeeId, secim.iso)}
            onSec={(sablonId) => {
              void atamaYaz(secim.employeeId, secim.iso, sablonId);
              setSecim(null);
            }}
            onKapat={() => setSecim(null)}
          />
        ) : null}
      </Modal>

      <Modal acik={modal === "araclar"} kapat={() => setModal(null)} baslik="Araçlar" genislik="max-w-lg">
        <div className="grid grid-cols-2 gap-2">
          <AracDugme baslik="Ekip" aciklama={`${personel.length} kişi`} onClick={() => setModal("ekip")} />
          <AracDugme
            baslik="İzin talepleri"
            aciklama={bekleyenIzinler.length ? `${bekleyenIzinler.length} bekliyor` : "Bekleyen yok"}
            onClick={() => setModal("izin")}
          />
          <AracDugme baslik="Duyuru" aciklama="Ekibe mesaj" onClick={() => setModal("duyuru")} />
          <AracDugme baslik="Vardiya şablonları" aciklama={`${sablonlar.length} şablon`} onClick={() => setModal("sablon")} />
          <AracDugme baslik="Paylaş" aciklama="PDF · WhatsApp" onClick={() => setModal("paylas")} />
          <AracDugme baslik="Kim gördü?" aciklama="Okundu bilgisi" onClick={() => setModal("okundu")} />
          <AracDugme baslik="Mesai saatleri" aciklama={`${data.business.openTime}–${data.business.closeTime}`} onClick={() => setModal("saatler")} />
          <AracDugme baslik="Raporlar" aciklama="CSV · yazdır" onClick={() => setModal("rapor")} />
        </div>

        {ziyaret ? (
          <div className="mt-4 rounded-xl border border-zinc-200 px-3 py-2.5 text-[12px] text-zinc-600">
            Site ziyaretçisi (tekil): bugün <strong>{ziyaret.bugun}</strong> · son 7 gün{" "}
            <strong>{ziyaret.hafta}</strong> · bu ay <strong>{ziyaret.ay}</strong>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Bu haftanın tüm vardiyaları silinsin mi?")) return;
              await clearWeek(haftaISO);
              await yukle();
              bidirKapat();
            }}
            className="btn-sessiz h-9 text-[12px]"
          >
            Haftayı temizle
          </button>
          <button
            type="button"
            onClick={async () => {
              const hedef = gunler[gunler.length - 1];
              const yeni = toISODate(new Date(new Date(`${hedef}T12:00:00`).getTime() + 86_400_000));
              await copyWeek(haftaISO, yeni);
              setOffset((o) => o + 1);
              await yukle();
            }}
            className="btn-sessiz h-9 text-[12px]"
          >
            Haftayı sonraki haftaya kopyala
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Panel demo verilerine sıfırlansın mı? Mevcut plan silinir.")) return;
              await resetData("demo");
              await yukle();
              setModal(null);
            }}
            className="btn-sessiz h-9 text-[12px] text-red-600"
          >
            Demo verisine sıfırla
          </button>
        </div>
      </Modal>

      <Modal acik={modal === "ekip"} kapat={() => setModal(null)} baslik="Ekip" genislik="max-w-2xl">
        <EkipYonetimi
          personel={personel}
          haftalar={haftalar}
          atamaMap={atamaMap}
          sablonlar={sablonlar}
          isletme={data.business.name}
          duzenlenen={duzenlenen}
          setDuzenlenen={setDuzenlenen}
          onChanged={yukle}
          bildir={bildir}
        />
      </Modal>

      <Modal acik={modal === "izin"} kapat={() => setModal(null)} baslik="İzin talepleri" genislik="max-w-2xl">
        <IzinYonetimi
          personel={personel}
          talepler={data.izinTalepleri ?? []}
          onChanged={yukle}
          bildir={bildir}
        />
      </Modal>

      <Modal acik={modal === "duyuru"} kapat={() => setModal(null)} baslik="Duyurular" genislik="max-w-xl">
        <DuyuruYonetimi
          duyurular={data.announcements}
          onChanged={yukle}
          bildir={bildir}
        />
      </Modal>

      <Modal acik={modal === "sablon"} kapat={() => setModal(null)} baslik="Vardiya şablonları" genislik="max-w-2xl">
        <TemplateManager
          templates={sablonlar}
          standart={{ openTime: data.business.openTime, closeTime: data.business.closeTime }}
          onChanged={yukle}
          gomulu
        />
      </Modal>

      <Modal acik={modal === "saatler"} kapat={() => setModal(null)} baslik="Standart mesai saatleri" genislik="max-w-md">
        <SaatAyari
          business={data.business}
          onKaydet={async (acilis, kapanis) => {
            await updateBusiness({ openTime: acilis, closeTime: kapanis });
            await yukle();
            bildir("Mesai saatleri güncellendi.");
            setModal(null);
          }}
        />
      </Modal>

      <Modal acik={modal === "paylas"} kapat={() => setModal(null)} baslik="Planı paylaş" genislik="max-w-xl">
        <Paylasim
          haftaISO={haftaISO}
          personel={personel}
          haftalar={haftalar}
          atamaMap={atamaMap}
          sablonlar={sablonlar}
          isletme={data.business.name}
          bildir={bildir}
        />
      </Modal>

      <Modal acik={modal === "okundu"} kapat={() => setModal(null)} baslik="Kim gördü?" genislik="max-w-xl">
        <OkunduKarti haftaISO={haftaISO} veri={okundu} setVeri={setOkundu} />
      </Modal>

      <Modal acik={modal === "rapor"} kapat={() => setModal(null)} baslik="Raporlar" genislik="max-w-md">
        <div className="space-y-2">
          <Link href="/raporlar" className="btn-ikincil flex h-10 items-center justify-center text-[13px]">
            Raporlar (CSV indir)
          </Link>
          <Link href="/takvim" className="btn-ikincil flex h-10 items-center justify-center text-[13px]">
            Takvim
          </Link>
          <Link href="/yazdir" className="btn-ikincil flex h-10 items-center justify-center text-[13px]">
            Yazdır
          </Link>
          <Link href="/bugun" className="btn-ikincil flex h-10 items-center justify-center text-[13px]">
            Bugün ekranı
          </Link>
        </div>
      </Modal>

      <Modal acik={modal === "uyarilar"} kapat={() => setModal(null)} baslik="Uyarılar" genislik="max-w-xl">
        <ul className="space-y-1.5">
          {analiz.issues.map((u, i) => {
            const emp = personel.find((p) => p.id === u.employeeId);
            return (
              <li key={`${u.employeeId}-${u.date}-${u.type}-${i}`}>
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    setSecim({ employeeId: u.employeeId, iso: u.date });
                  }}
                  className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] hover:bg-zinc-50"
                >
                  <span
                    className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                      u.severity === "error" ? "bg-red-500" : "bg-amber-500"
                    }`}
                    aria-hidden
                  />
                  <span>
                    <strong className="font-medium">{emp?.name ?? "Personel"}</strong> ·{" "}
                    {formatDayDate(new Date(`${u.date}T12:00:00`))} — {u.message}
                  </span>
                </button>
              </li>
            );
          })}
          {analiz.issues.length === 0 ? (
            <li className="text-[13px] text-zinc-500">Uyarı yok.</li>
          ) : null}
        </ul>
        <p className="mt-3 text-[11.5px] leading-relaxed text-zinc-500">
          Kontroller: haftalık 45 saat, günlük 11 saat, iki vardiya arası 11 saat dinlenme,
          gece 7,5 saat. Bu ekran hukuki danışmanlık değildir.
        </p>
      </Modal>
    </main>
  );

  function bidirKapat() {
    setModal(null);
    bildir("Hafta temizlendi.");
  }
}

/* ------------------------------------------------------------------ *
 * Küçük parçalar
 * ------------------------------------------------------------------ */

function Hucre({
  sablon,
  izin,
  bugun,
  onClick,
  etiket,
}: {
  sablon?: ShiftTemplate;
  izin: boolean;
  bugun: boolean;
  onClick: () => void;
  etiket: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${etiket}: ${izin ? "izinli" : sablon ? `${sablon.name} ${shiftSaatMetni(sablon)}` : "vardiya yok"}`}
      className={`flex h-[46px] w-full flex-col items-center justify-center gap-0.5 rounded-lg border text-[11.5px] transition-colors ${
        izin
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : sablon
            ? `${COLOR_CLASSES[sablon.color].chip} hover:brightness-95`
            : `border-dashed border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 ${
                bugun ? "bg-amber-50/40" : ""
              }`
      }`}
    >
      {izin ? (
        <span>İzinli</span>
      ) : sablon ? (
        <>
          <span className="font-medium leading-tight">{sablon.name}</span>
          <span className="text-[10.5px] leading-tight opacity-80">{shiftSaatMetni(sablon)}</span>
        </>
      ) : (
        <span aria-hidden>+</span>
      )}
    </button>
  );
}

function VardiyaSecici({
  emp,
  iso,
  sablonlar,
  secili,
  izin,
  onSec,
  onKapat,
}: {
  emp: Employee | null;
  iso: string;
  sablonlar: ShiftTemplate[];
  secili: string;
  izin: boolean;
  onSec: (sablonId: string) => void;
  onKapat: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-zinc-600">
        <strong className="text-zinc-900">{emp?.name ?? "Personel"}</strong> ·{" "}
        {formatDayDate(new Date(`${iso}T12:00:00`))}
        {izin ? <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-900">İzinli</span> : null}
      </p>

      <div className="grid gap-2">
        {sablonlar.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSec(s.id)}
            className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-[13px] ${
              secili === s.id ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${COLOR_CLASSES[s.color].dot}`} aria-hidden />
              <span className="font-medium">{s.name}</span>
            </span>
            <span className="text-[12px] text-zinc-500">
              {shiftSaatMetni(s)} · {shiftHours(s)} sa
            </span>
          </button>
        ))}

        {sablonlar.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 px-3 py-6 text-center text-[13px] text-zinc-500">
            Vardiya şablonu yok. Araçlar → Vardiya şablonları.
          </p>
        ) : null}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSec("")}
          disabled={!secili}
          className="btn-sessiz h-10 flex-1 text-[13px] disabled:opacity-40"
        >
          Boşalt
        </button>
        <button type="button" onClick={onKapat} className="btn-ikincil h-10 flex-1 text-[13px]">
          Kapat
        </button>
      </div>
    </div>
  );
}

function AracDugme({ baslik, aciklama, onClick }: { baslik: string; aciklama: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-zinc-200 px-3 py-2.5 text-left transition-colors hover:bg-zinc-50"
    >
      <span className="block text-[13px] font-medium text-zinc-900">{baslik}</span>
      <span className="block text-[11.5px] text-zinc-500">{aciklama}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Ekip
 * ------------------------------------------------------------------ */

function EkipYonetimi({
  personel,
  haftalar,
  atamaMap,
  sablonlar,
  isletme,
  duzenlenen,
  setDuzenlenen,
  onChanged,
  bildir,
}: {
  personel: Employee[];
  haftalar: Date[];
  atamaMap: Map<string, string>;
  sablonlar: ShiftTemplate[];
  isletme: string;
  duzenlenen: Duzenlenen;
  setDuzenlenen: (d: Duzenlenen) => void;
  onChanged: () => Promise<void>;
  bildir: (m: string) => void;
}) {
  const [ad, setAd] = useState("");
  const [rol, setRol] = useState("");
  const [tel, setTel] = useState("");
  const [mesgul, setMesgul] = useState(false);

  async function ekle(e: React.FormEvent) {
    e.preventDefault();
    if (!ad.trim()) return;
    setMesgul(true);
    try {
      await addEmployee({ name: ad.trim(), role: rol.trim() || "Personel", phone: tel.trim() });
      setAd("");
      setRol("");
      setTel("");
      await onChanged();
      bildir("Personel eklendi.");
    } catch {
      bildir("Personel eklenemedi.");
    } finally {
      setMesgul(false);
    }
  }

  async function kaydet() {
    if (!duzenlenen) return;
    setMesgul(true);
    try {
      await updateEmployee(duzenlenen.id, {
        name: duzenlenen.name,
        role: duzenlenen.role,
        phone: duzenlenen.phone,
      });
      setDuzenlenen(null);
      await onChanged();
      bildir("Personel güncellendi.");
    } catch {
      bildir("Güncellenemedi.");
    } finally {
      setMesgul(false);
    }
  }

  async function cikar(emp: Employee) {
    if (!confirm(`${emp.name} çıkarılsın mı? Vardiyaları da silinir.`)) return;
    try {
      await deleteEmployee(emp.id);
      await onChanged();
      bildir("Personel çıkarıldı.");
    } catch {
      bildir("Çıkarılamadı.");
    }
  }

  async function baglantiKopyala(emp: Employee) {
    try {
      const r = await fetch(`/api/baglanti/${emp.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ islem: "ac" }),
      });
      const j = (await r.json()) as { yol?: string | null; aktif?: boolean };
      if (!j.yol) throw new Error("yol yok");
      const tam = new URL(j.yol, window.location.origin).toString();
      await navigator.clipboard.writeText(tam);
      bildir("Personel bağlantısı kopyalandı.");
    } catch {
      bildir("Bağlantı oluşturulamadı.");
    }
  }

  function whatsapp(emp: Employee) {
    const atamalar: Record<string, string> = {};
    for (const [k, v] of atamaMap) atamalar[k.replace("__", "__")] = v;
    const metin = buildScheduleText(
      emp,
      haftalar,
      atamalar,
      sablonlar,
      isletme,
    );
    window.open(buildWhatsAppLink(emp.phone, metin), "_blank", "noopener");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={ekle} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Ad soyad" className="giris h-9 text-[13px]" required />
        <input value={rol} onChange={(e) => setRol(e.target.value)} placeholder="Görev (Barista)" className="giris h-9 text-[13px]" />
        <input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="Telefon (05..)" className="giris h-9 text-[13px]" />
        <button type="submit" disabled={mesgul} className="btn-birincil h-9 text-[12.5px] disabled:opacity-50">
          Ekle
        </button>
      </form>

      <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
        {personel.length === 0 ? (
          <p className="px-3 py-6 text-center text-[13px] text-zinc-500">Henüz personel yok.</p>
        ) : (
          personel.map((emp) => (
            <div key={emp.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
              {duzenlenen?.id === emp.id ? (
                <div className="flex w-full flex-wrap items-center gap-2">
                  <input
                    value={duzenlenen.name}
                    onChange={(e) => setDuzenlenen({ ...duzenlenen, name: e.target.value })}
                    className="giris h-8 w-40 text-[12.5px]"
                  />
                  <input
                    value={duzenlenen.role}
                    onChange={(e) => setDuzenlenen({ ...duzenlenen, role: e.target.value })}
                    className="giris h-8 w-32 text-[12.5px]"
                  />
                  <input
                    value={duzenlenen.phone}
                    onChange={(e) => setDuzenlenen({ ...duzenlenen, phone: e.target.value })}
                    className="giris h-8 w-36 text-[12.5px]"
                  />
                  <button type="button" onClick={() => void kaydet()} className="btn-birincil h-8 text-[12px]">
                    Kaydet
                  </button>
                  <button type="button" onClick={() => setDuzenlenen(null)} className="btn-sessiz h-8 text-[12px]">
                    Vazgeç
                  </button>
                </div>
              ) : (
                <>
                  <span className={`h-2 w-2 rounded-full ${COLOR_CLASSES[emp.color]?.dot ?? "bg-zinc-400"}`} aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{emp.name}</span>
                  <span className="hidden text-[12px] text-zinc-500 sm:inline">{emp.role}</span>
                  <button
                    type="button"
                    onClick={() => setDuzenlenen({ id: emp.id, name: emp.name, role: emp.role, phone: emp.phone })}
                    className="btn-sessiz h-8 text-[11.5px]"
                  >
                    Düzenle
                  </button>
                  <button type="button" onClick={() => void baglantiKopyala(emp)} className="btn-sessiz h-8 text-[11.5px]">
                    Bağlantı
                  </button>
                  <button type="button" onClick={() => whatsapp(emp)} className="btn-sessiz h-8 text-[11.5px]">
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => void cikar(emp)}
                    className="btn-sessiz h-8 text-[11.5px] text-red-600"
                  >
                    Çıkar
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <p className="text-[11.5px] leading-relaxed text-zinc-500">
        Personel numarası gerekmez. “Bağlantı” ile personele özel, salt okunur plan adresi
        kopyalanır (telefon numarası paylaşılmaz).
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * İzin
 * ------------------------------------------------------------------ */

function IzinYonetimi({
  personel,
  talepler,
  onChanged,
  bildir,
}: {
  personel: Employee[];
  talepler: IzinTalebi[];
  onChanged: () => Promise<void>;
  bildir: (m: string) => void;
}) {
  const [empId, setEmpId] = useState(personel[0]?.id ?? "");
  const [bas, setBas] = useState(BUGUN);
  const [bit, setBit] = useState(BUGUN);
  const [tur, setTur] = useState("izin");
  const bekleyen = talepler.filter((t) => t.durum === "bekliyor");

  async function karar(id: string, durum: "onaylandi" | "reddedildi") {
    try {
      await decideIzin(id, durum);
      await onChanged();
      bildir(durum === "onaylandi" ? "İzin onaylandı." : "İzin reddedildi.");
    } catch {
      bildir("İşlem yapılamadı.");
    }
  }

  async function ekle(e: React.FormEvent) {
    e.preventDefault();
    if (!empId) return;
    try {
      await addIzin({ employeeId: empId, baslangic: bas, bitis: bit, tur });
      await onChanged();
      bildir("İzin eklendi (onaylı).");
    } catch {
      bildir("İzin eklenemedi.");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[13px] font-semibold">Bekleyen talepler</h3>
        {bekleyen.length === 0 ? (
          <p className="mt-1 text-[12.5px] text-zinc-500">Bekleyen talep yok.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {bekleyen.map((t) => {
              const emp = personel.find((p) => p.id === t.employeeId);
              return (
                <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">{emp?.name ?? "Personel"}</p>
                    <p className="text-[12px] text-zinc-500">
                      {t.baslangic} → {t.bitis} · {t.tur}
                      {t.not ? ` · ${t.not}` : ""}
                    </p>
                  </div>
                  <button type="button" onClick={() => void karar(t.id, "onaylandi")} className="btn-birincil h-8 text-[12px]">
                    Onayla
                  </button>
                  <button type="button" onClick={() => void karar(t.id, "reddedildi")} className="btn-sessiz h-8 text-[12px]">
                    Reddet
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={ekle} className="space-y-2 rounded-xl border border-zinc-200 p-3">
        <h3 className="text-[13px] font-semibold">Elle izin ekle</h3>
        <select value={empId} onChange={(e) => setEmpId(e.target.value)} className="giris h-9 text-[13px]">
          {personel.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={bas} onChange={(e) => setBas(e.target.value)} className="giris h-9 text-[13px]" />
          <input type="date" value={bit} onChange={(e) => setBit(e.target.value)} className="giris h-9 text-[13px]" />
        </div>
        <select value={tur} onChange={(e) => setTur(e.target.value)} className="giris h-9 text-[13px]">
          <option value="izin">İzin</option>
          <option value="mazeret">Mazeret</option>
          <option value="rapor">Rapor</option>
          <option value="degisim">Vardiya değişimi</option>
        </select>
        <button type="submit" className="btn-birincil h-9 w-full text-[12.5px]">
          Ekle
        </button>
      </form>

      <div>
        <h3 className="text-[13px] font-semibold">Son kararlar</h3>
        <ul className="mt-1 space-y-1 text-[12px] text-zinc-600">
          {talepler
            .filter((t) => t.durum !== "bekliyor")
            .slice(0, 8)
            .map((t) => (
              <li key={t.id}>
                {personel.find((p) => p.id === t.employeeId)?.name ?? "Personel"} · {t.baslangic} → {t.bitis} ·{" "}
                <strong>{t.durum}</strong>
              </li>
            ))}
          {talepler.filter((t) => t.durum !== "bekliyor").length === 0 ? <li>Kayıt yok.</li> : null}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Duyuru
 * ------------------------------------------------------------------ */

function DuyuruYonetimi({
  duyurular,
  onChanged,
  bildir,
}: {
  duyurular: StatePayload["announcements"];
  onChanged: () => Promise<void>;
  bildir: (m: string) => void;
}) {
  const [metin, setMetin] = useState("");

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    const temiz = metin.trim();
    if (!temiz) return;
    try {
      await createAnnouncement(temiz);
      setMetin("");
      await onChanged();
      bildir("Duyuru eklendi.");
    } catch {
      bildir("Duyuru eklenemedi.");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={gonder} className="space-y-2">
        <textarea
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          rows={3}
          maxLength={400}
          placeholder="Ekibe kısa bir not (ör. cumartesi stok sayımı 10:00)."
          className="giris w-full py-2 text-[13px]"
        />
        <button type="submit" className="btn-birincil h-9 w-full text-[12.5px]">
          Duyuruyu yayınla
        </button>
      </form>

      <ul className="space-y-2">
        {duyurular.map((d) => (
          <li key={d.id} className="flex items-start gap-2 rounded-xl border border-zinc-200 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-[13px]">{d.message}</p>
              <p className="text-[11px] text-zinc-400">
                {new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d.createdAt))}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Duyuru silinsin mi?")) return;
                await deleteAnnouncement(d.id);
                await onChanged();
              }}
              className="text-[11.5px] text-red-600"
            >
              Sil
            </button>
          </li>
        ))}
        {duyurular.length === 0 ? <li className="text-[12.5px] text-zinc-500">Henüz duyuru yok.</li> : null}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Mesai saatleri
 * ------------------------------------------------------------------ */

function SaatAyari({
  business,
  onKaydet,
}: {
  business: StatePayload["business"];
  onKaydet: (acilis: string, kapanis: string) => Promise<void>;
}) {
  const [acilis, setAcilis] = useState(business.openTime);
  const [kapanis, setKapanis] = useState(business.closeTime);
  const [mesgul, setMesgul] = useState(false);
  const gecerli = acilis !== kapanis;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[12px] text-zinc-600">
          Açılış
          <input type="time" value={acilis} onChange={(e) => setAcilis(e.target.value)} className="giris mt-1 h-9 text-[13px]" />
        </label>
        <label className="text-[12px] text-zinc-600">
          Kapanış
          <input type="time" value={kapanis} onChange={(e) => setKapanis(e.target.value)} className="giris mt-1 h-9 text-[13px]" />
        </label>
      </div>
      {!gecerli ? (
        <p className="text-[12px] text-red-600">Açılış ve kapanış aynı olamaz (24 saat için 23:59 yaz).</p>
      ) : null}
      <button
        type="button"
        disabled={!gecerli || mesgul}
        onClick={async () => {
          setMesgul(true);
          try {
            await onKaydet(acilis, kapanis);
          } finally {
            setMesgul(false);
          }
        }}
        className="btn-birincil h-9 w-full text-[12.5px] disabled:opacity-50"
      >
        Kaydet
      </button>
      <p className="text-[11.5px] leading-relaxed text-zinc-500">
        Bu saatler yeni vardiya şablonlarının varsayılanıdır ve mevcut şablonları değiştirmez.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Paylaşım
 * ------------------------------------------------------------------ */

function Paylasim({
  haftaISO,
  personel,
  haftalar,
  atamaMap,
  sablonlar,
  isletme,
  bildir,
}: {
  haftaISO: string;
  personel: Employee[];
  haftalar: Date[];
  atamaMap: Map<string, string>;
  sablonlar: ShiftTemplate[];
  isletme: string;
  bildir: (m: string) => void;
}) {
  const [gonderiliyor, setGonderiliyor] = useState(false);

  function atamalar(): Record<string, string> {
    const cikti: Record<string, string> = {};
    for (const [k, v] of atamaMap) cikti[k] = v;
    return cikti;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <a
          href={`/api/plan/pdf?hafta=${haftaISO}`}
          className="btn-ikincil flex h-10 items-center justify-center text-[13px]"
        >
          PDF indir
        </a>
        <button
          type="button"
          disabled={gonderiliyor}
          onClick={async () => {
            setGonderiliyor(true);
            try {
              const r = await fetch(`/api/plan/pdf?hafta=${haftaISO}`, { method: "POST" });
              const j = (await r.json().catch(() => ({}))) as { hata?: string };
              bildir(r.ok ? "PDF e-posta ile gönderildi." : (j.hata ?? "Gönderilemedi."));
            } catch {
              bildir("Gönderilemedi.");
            } finally {
              setGonderiliyor(false);
            }
          }}
          className="btn-ikincil h-10 text-[13px] disabled:opacity-50"
        >
          {gonderiliyor ? "Gönderiliyor…" : "Kendime e-postala"}
        </button>
      </div>

      <div>
        <h3 className="text-[13px] font-semibold">WhatsApp mesajı</h3>
        <div className="mt-2 space-y-2">
          {personel.map((emp) => (
            <div key={emp.id} className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 px-3 py-2">
              <span className="truncate text-[13px]">{emp.name}</span>
              <button
                type="button"
                onClick={() => {
                  const metin = buildScheduleText(emp, haftalar, atamalar(), sablonlar, isletme);
                  window.open(buildWhatsAppLink(emp.phone, metin), "_blank", "noopener");
                }}
                className="btn-sessiz h-8 text-[11.5px]"
              >
                Gönder
              </button>
            </div>
          ))}
          {personel.length === 0 ? <p className="text-[12.5px] text-zinc-500">Personel yok.</p> : null}
        </div>
      </div>

      <p className="text-[11.5px] leading-relaxed text-zinc-500">
        Otomatik toplu gönderim yok: her mesaj WhatsApp&apos;ta senin onayınla açılır.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Okundu
 * ------------------------------------------------------------------ */

function OkunduKarti({
  haftaISO,
  veri,
  setVeri,
}: {
  haftaISO: string;
  veri: OkunduYaniti | null;
  setVeri: (v: OkunduYaniti | null) => void;
}) {
  const [hata, setHata] = useState(false);

  useEffect(() => {
    let iptal = false;
    okunduOzeti(haftaISO)
      .then((v) => {
        if (!iptal) {
          setVeri(v);
          setHata(false);
        }
      })
      .catch(() => {
        if (!iptal) setHata(true);
      });
    return () => {
      iptal = true;
    };
  }, [haftaISO, setVeri]);

  if (hata) return <p className="text-[13px] text-zinc-500">Okundu bilgisi alınamadı.</p>;
  if (!veri || veri.hafta !== haftaISO) {
    return <p className="text-[13px] text-zinc-500">Yükleniyor…</p>;
  }
  if (!veri.yayinda) {
    return <p className="text-[13px] text-zinc-500">Bu hafta taslak — yayınlayınca personel görebilir.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-[12.5px]">
          <span className="font-semibold">Haftalık plan</span>
          <span className="text-zinc-500">
            {veri.plan.goren}/{veri.plan.toplam} · %{Math.round(veri.plan.oran * 100)}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full bg-emerald-500" style={{ width: `${Math.round(veri.plan.oran * 100)}%` }} />
        </div>
        {veri.plan.gormeyenAdlar.length ? (
          <p className="mt-1 text-[11.5px] text-zinc-500">Görmeyenler: {veri.plan.gormeyenAdlar.join(", ")}</p>
        ) : null}
      </div>

      {veri.duyurular.map((d) => (
        <div key={d.id}>
          <div className="flex items-center justify-between text-[12px]">
            <span className="max-w-[70%] truncate">{d.message}</span>
            <span className="text-zinc-500">
              {d.ozet.goren}/{d.ozet.toplam}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
