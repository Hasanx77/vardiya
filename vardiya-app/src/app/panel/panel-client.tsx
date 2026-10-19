"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Employee, StatePayload } from "@/lib/types";
import {
  addEmployee as apiAddEmployee,
  clearWeek as apiClearWeek,
  copyWeek as apiCopyWeek,
  createAnnouncement as apiCreateAnnouncement,
  deleteAnnouncement as apiDeleteAnnouncement,
  deleteEmployee as apiDeleteEmployee,
  fetchState,
  resetData as apiResetData,
  setAssignment as apiSetAssignment,
  setDayNote as apiSetDayNote,
  updateBusiness as apiUpdateBusiness,
  updateEmployee as apiUpdateEmployee,
  updateTemplate as apiUpdateTemplate,
} from "@/lib/api-client";
import { addDays, formatShort, formatWeekRange, getWeekDates, toISODate, DAY_SHORT_TR } from "@/lib/dates";
import { shiftHours, WEEKLY_LIMIT_HOURS, standartSablonlar } from "@/lib/shifts";
import { analyzeWeek, MIN_DAILY_REST_HOURS } from "@/lib/compliance";
import { COLOR_CLASSES } from "@/lib/colors";
import { buildScheduleText, buildWhatsAppLink } from "@/lib/whatsapp";
import TemplateManager from "@/components/TemplateManager";
import Modal from "@/components/Modal";
import { csvIndir } from "@/lib/csv";
import { getHoliday } from "@/lib/holidays";

function keyOf(employeeId: string, iso: string) {
  return `${employeeId}__${iso}`;
}

/** Küçük satır içi simgeler (emoji yerine — daha sakin bir arayüz). */
function KalemIkon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" strokeLinejoin="round" />
      <path d="m14.5 5.5 3 3" />
    </svg>
  );
}

function OkIkon({ yon = "sag" }: { yon?: "sag" | "sol" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-4 w-4 ${yon === "sol" ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PanelClient({
  initialData,
  ziyaret,
}: {
  initialData: StatePayload;
  /** Yalnızca site sahibine gönderilir (panel/page.tsx). */
  ziyaret?: { bugun: number; hafta: number; ay: number };
}) {
  const [data, setData] = useState<StatePayload | null>(initialData);
  const [error, setError] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [empDraft, setEmpDraft] = useState({
    name: "",
    phone: "",
    role: "",
    annualLeaveDays: "",
  });
  const [announcementDraft, setAnnouncementDraft] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStandart, setShowStandart] = useState(false);
  const [acilisDraft, setAcilisDraft] = useState(initialData.business.openTime);
  const [kapanisDraft, setKapanisDraft] = useState(initialData.business.closeTime);
  const [search, setSearch] = useState("");
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", role: "" });
  const [nameDraft, setNameDraft] = useState(initialData.business.name);
  const [nameEdit, setNameEdit] = useState(false);
  const [toast, setToast] = useState("");

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2400);
  }, []);

  const load = useCallback(async () => {
    try {
      const state = await fetchState();
      setData(state);
      setNameDraft(state.business.name);
      setAcilisDraft(state.business.openTime);
      setKapanisDraft(state.business.closeTime);
      setError("");
    } catch {
      setError("Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.");
    }
  }, []);

  // Modallar ESC ile kapansın
  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setShowForm(false);
      setNameEdit(false);
    }
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, []);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const assignMap = useMemo(() => {
    const m = new Map<string, string>();
    data?.assignments.forEach((a) => m.set(keyOf(a.employeeId, a.date), a.shiftTemplateId));
    return m;
  }, [data]);

  const empById = useMemo(() => {
    const m = new Map<string, Employee>();
    data?.employees.forEach((e) => m.set(e.id, e));
    return m;
  }, [data]);

  const templateById = useMemo(() => {
    const m = new Map<string, StatePayload["shiftTemplates"][number]>();
    data?.shiftTemplates.forEach((t) => m.set(t.id, t));
    return m;
  }, [data]);

  // Mevzuat/çakışma analizi (saf fonksiyon) — her veri/hafta değişiminde yeniden hesaplanır
  const analysis = useMemo(() => {
    if (!data) return null;
    const weekISO = weekDates.map((d) => toISODate(d));
    return analyzeWeek({
      employees: data.employees.map((e) => ({ id: e.id, name: e.name })),
      shifts: data.shiftTemplates,
      assignments: data.assignments,
      weekDates: weekISO,
      previousDate: toISODate(addDays(weekDates[0], -1)),
    });
  }, [data, weekDates]);

  const todayISO = toISODate(new Date());
  const todayByShift = useMemo(() => {
    const m = new Map<string, Employee[]>();
    if (!data) return m;
    data.employees.forEach((e) => {
      const sid = assignMap.get(keyOf(e.id, todayISO));
      if (!sid) return;
      const arr = m.get(sid) ?? [];
      arr.push(e);
      m.set(sid, arr);
    });
    return m;
  }, [data, assignMap, todayISO]);

  const empMonthStats = useMemo(() => {
    const m = new Map<string, { hours: number; days: number }>();
    if (!data) return m;
    data.employees.forEach((e) => m.set(e.id, { hours: 0, days: 0 }));
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    for (const a of data.assignments) {
      if (!a.date.startsWith(prefix)) continue;
      const t = templateById.get(a.shiftTemplateId);
      const cur = m.get(a.employeeId);
      if (!t || !cur) continue;
      cur.hours += shiftHours(t);
      cur.days += 1;
    }
    return m;
  }, [data, templateById]);

  const dayNoteMap = useMemo(() => {
    const m = new Map<string, string>();
    data?.dayNotes.forEach((d) => m.set(d.date, d.note));
    return m;
  }, [data]);

  const coverageIssues = useMemo(() => {
    const list: { date: string; templateId: string; have: number; need: number }[] = [];
    if (!data) return list;
    for (const d of weekDates) {
      const iso = toISODate(d);
      for (const t of data.shiftTemplates) {
        if (t.minStaff <= 0) continue;
        let have = 0;
        for (const e of data.employees) {
          if (assignMap.get(`${e.id}__${iso}`) === t.id) have++;
        }
        if (have < t.minStaff) list.push({ date: iso, templateId: t.id, have, need: t.minStaff });
      }
    }
    return list;
  }, [data, weekDates, assignMap]);

  async function changeAssignment(employeeId: string, iso: string, shiftTemplateId: string) {
    // Önce ekranda güncelle (hızlı), sonra sunucuya yaz
    setData((prev) => {
      if (!prev) return prev;
      const others = prev.assignments.filter(
        (a) => !(a.employeeId === employeeId && a.date === iso)
      );
      const next = shiftTemplateId
        ? [...others, { employeeId, date: iso, shiftTemplateId }]
        : others;
      return { ...prev, assignments: next };
    });
    try {
      await apiSetAssignment(employeeId, iso, shiftTemplateId);
    } catch {
      flash("Kaydedilemedi, yeniden deneniyor…");
      load();
    }
  }

  async function handleAddEmployee() {
    const name = form.name.trim();
    if (!name) return flash("Personel adı gerekli.");
    try {
      await apiAddEmployee({
        name,
        phone: form.phone.trim(),
        role: form.role.trim(),
      });
      setForm({ name: "", phone: "", role: "" });
      setShowForm(false);
      await load();
      flash("Personel eklendi.");
    } catch {
      flash("Personel eklenemedi.");
    }
  }

  async function handleRemoveEmployee(emp: Employee) {
    if (!window.confirm(`${emp.name} silinsin mi? Vardiyaları da silinir.`)) return;
    try {
      await apiDeleteEmployee(emp.id);
      await load();
      flash("Personel silindi.");
    } catch {
      flash("Silinemedi.");
    }
  }

  /** Standart mesai saatlerini kaydet */
  async function standartKaydet() {
    if (!data) return;
    if (acilisDraft === kapanisDraft) return flash("Açılış ve kapanış aynı olamaz.");
    try {
      await apiUpdateBusiness({ openTime: acilisDraft, closeTime: kapanisDraft });
      await load();
      flash("Standart mesai saatleri kaydedildi.");
    } catch {
      flash("Kaydedilemedi.");
    }
  }

  /** Mevcut şablonları standart saatlere uydur (atamalar silinmez) */
  async function sablonlariStandartaUydur() {
    if (!data) return;
    const hedef = standartSablonlar(acilisDraft, kapanisDraft);
    let sayi = 0;
    try {
      for (const s of hedef) {
        const mevcut = data.shiftTemplates.find((t) => t.name === s.name);
        if (!mevcut) continue;
        await apiUpdateTemplate(mevcut.id, { start: s.start, end: s.end });
        sayi++;
      }
      await load();
      flash(sayi > 0 ? `${sayi} şablon standart saatlere uyduruldu.` : "Eşleşen şablon yok.");
    } catch {
      flash("Şablonlar güncellenemedi.");
    }
  }

  async function saveBusinessName() {
    if (!data) return;
    const name = nameDraft.trim();
    setNameEdit(false);
    if (!name || name === data.business.name) {
      setNameDraft(data.business.name);
      return;
    }
    try {
      await apiUpdateBusiness({ name });
      await load();
      flash("İşletme adı kaydedildi.");
    } catch {
      flash("Kaydedilemedi.");
    }
  }

  async function handleCopyPrev() {
    const monday = weekDates[0];
    const fromISO = toISODate(addDays(monday, -7));
    const toISO = toISODate(monday);
    if (
      !window.confirm(
        "Geçen haftanın vardiyaları bu haftaya kopyalanacak. Bu haftanın mevcut planı silinecek. Devam?"
      )
    )
      return;
    try {
      await apiCopyWeek(fromISO, toISO);
      await load();
      flash("Geçen hafta kopyalandı.");
    } catch {
      flash("Kopyalanamadı.");
    }
  }

  async function handleClearWeek() {
    const toISO = toISODate(weekDates[0]);
    if (!window.confirm("Bu haftanın TÜM vardiyaları silinsin mi?")) return;
    try {
      await apiClearWeek(toISO);
      await load();
      flash("Hafta temizlendi.");
    } catch {
      flash("Temizlenemedi.");
    }
  }

  async function handleReset(mode: "demo" | "empty") {
    const msg =
      mode === "demo"
        ? "Tüm veriler silinip örnek veri yüklenecek. Devam?"
        : "TÜM personel, vardiya ve talepler silinecek (boş başlangıç). Devam?";
    if (!window.confirm(msg)) return;
    try {
      await apiResetData(mode);
      setShowSettings(false);
      await load();
      flash(mode === "demo" ? "Örnek veri yüklendi." : "Sıfırlandı, boş başlayabilirsin.");
    } catch {
      flash("İşlem başarısız.");
    }
  }

  function exportCsv() {
    if (!data) return;
    const satirlar: (string | number)[][] = [
      [
        "Personel",
        "Görev",
        ...weekDates.map((d) => formatShort(d)),
        "Toplam Saat",
        "45 saat üstü (sa)",
      ],
    ];
    for (const emp of data.employees) {
      const cells = weekDates.map((d) => {
        const sid = assignMap.get(keyOf(emp.id, toISODate(d)));
        const t = sid ? templateById.get(sid) : undefined;
        return t ? `${t.name} ${t.start}-${t.end}` : "";
      });
      satirlar.push([emp.name, emp.role, ...cells, weekTotal(emp), empOvertime(emp)]);
    }
    csvIndir(`vardiya-${toISODate(weekDates[0])}.csv`, satirlar);
    flash("CSV indirildi.");
  }

  async function postAnnouncement() {
    const message = announcementDraft.trim();
    if (!message) return flash("Mesaj boş.");
    try {
      await apiCreateAnnouncement(message);
      setAnnouncementDraft("");
      await load();
      flash("Duyuru yayınlandı.");
    } catch {
      flash("Yayınlanamadı.");
    }
  }

  async function removeAnnouncement(id: string) {
    if (!window.confirm("Duyuru silinsin mi?")) return;
    try {
      await apiDeleteAnnouncement(id);
      await load();
      flash("Duyuru silindi.");
    } catch {
      flash("Silinemedi.");
    }
  }

  async function editDayNote(iso: string) {
    const current = dayNoteMap.get(iso) ?? "";
    const val = window.prompt("Gün notu (boş bırak = sil):", current);
    if (val === null) return;
    try {
      await apiSetDayNote(iso, val);
      await load();
      flash("Not kaydedildi.");
    } catch {
      flash("Not kaydedilemedi.");
    }
  }

  function startEditEmp(emp: Employee) {
    setEditingEmpId(emp.id);
    setExpandedEmpId(emp.id);
    setEmpDraft({
      name: emp.name,
      phone: emp.phone,
      role: emp.role,
      annualLeaveDays: emp.annualLeaveDays != null ? String(emp.annualLeaveDays) : "14",
    });
  }

  async function saveEmp() {
    if (!editingEmpId) return;
    const name = empDraft.name.trim();
    if (!name) return flash("Ad gerekli.");
    try {
      await apiUpdateEmployee(editingEmpId, {
        name,
        phone: empDraft.phone.trim(),
        role: empDraft.role.trim(),
        annualLeaveDays:
          empDraft.annualLeaveDays.trim() === ""
            ? 14
            : Math.max(0, Math.round(Number(empDraft.annualLeaveDays) || 0)),
      });
      setEditingEmpId(null);
      await load();
      flash("Personel güncellendi.");
    } catch {
      flash("Güncellenemedi.");
    }
  }

  function weekTotal(emp: Employee): number {
    let total = 0;
    for (const d of weekDates) {
      const shiftId = assignMap.get(keyOf(emp.id, toISODate(d)));
      if (!shiftId) continue;
      const t = templateById.get(shiftId);
      if (t) total += shiftHours(t);
    }
    return total;
  }

  /** Personelin haftalık fazla mesai saati (45 sa üstü) */
  function empOvertime(emp: Employee): number {
    return analysis?.perEmployee.get(emp.id)?.overtimeHours ?? 0;
  }

  /** Personelin bu hafta çalıştığı günlerin kısa adları (ör. "Pzt, Çar, Cum") */
  function calistigiGunler(emp: Employee): string[] {
    return weekDates
      .filter((d) => assignMap.has(keyOf(emp.id, toISODate(d))))
      .map((d) => DAY_SHORT_TR[(d.getDay() + 6) % 7]);
  }

  function sendWhatsApp(emp: Employee) {
    if (!data) return;
    if (!emp.phone.trim()) return flash("Bu personelin telefonu yok.");
    const text = buildScheduleText(
      emp,
      weekDates,
      Object.fromEntries(
        [...assignMap.entries()].map(([k, v]) => [k, v])
      ),
      data.shiftTemplates,
      data.business.name
    );
    window.open(buildWhatsAppLink(emp.phone, text), "_blank");
  }

  async function copySchedule(emp: Employee) {
    if (!data) return;
    const text = buildScheduleText(
      emp,
      weekDates,
      Object.fromEntries([...assignMap.entries()]),
      data.shiftTemplates,
      data.business.name
    );
    try {
      await navigator.clipboard.writeText(text);
      flash("Program kopyalandı.");
    } catch {
      flash("Kopyalanamadı.");
    }
  }

  async function copyStaffLink(emp: Employee) {
    const url = `${window.location.origin}/ekip/${emp.id}`;
    try {
      await navigator.clipboard.writeText(url);
      flash("Personel linki kopyalandı.");
    } catch {
      flash("Kopyalanamadı.");
    }
  }

  /** ⋯ menüsünde bir işlem seçilince menüyü kapat. */
  function kapatMenu(e: React.MouseEvent<HTMLElement>) {
    (e.currentTarget as HTMLElement).closest("details")?.removeAttribute("open");
  }

  if (error) {
    return (
      <main className="flex-1 grid place-items-center px-4">
        <div className="kart max-w-sm p-6 text-center">
          <p className="text-sm font-medium text-zinc-800">{error}</p>
          <button onClick={load} className="btn-birincil mt-4">
            Tekrar dene
          </button>
        </div>
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

  const summaryHours = data.employees.reduce((s, e) => s + weekTotal(e), 0);
  const issues = analysis?.issues ?? [];
  const uyariSayisi = issues.length + coverageIssues.length;
  const calisanSayisi = data.employees.filter((e) => calistigiGunler(e).length > 0).length;

  const visibleEmployees = data.employees.filter((e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q);
  });

  const dayCounts = weekDates.map((d) => {
    const iso = toISODate(d);
    return data.employees.reduce(
      (n, e) => n + (assignMap.get(keyOf(e.id, iso)) ? 1 : 0),
      0
    );
  });
  const weekEmpty = data.employees.length === 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      {/* Başlık */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            İşletme
          </p>
          {nameEdit ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={saveBusinessName}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveBusinessName();
              }}
              aria-label="İşletme adı"
              className="mt-1 w-full max-w-sm rounded-lg border border-zinc-300 bg-white px-2 py-1 text-2xl font-semibold outline-none focus:border-zinc-900 sm:text-3xl"
            />
          ) : (
            <button
              type="button"
              onClick={() => setNameEdit(true)}
              className="group mt-1 flex max-w-full items-center gap-2 text-left"
              title="İşletme adını düzenle"
            >
              <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                {data.business.name}
              </h1>
              <span className="text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">
                <KalemIkon />
              </span>
            </button>
          )}
          <p className="mt-1 text-sm text-zinc-500">
            Haftalık vardiya planı · {data.employees.length} personel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleCopyPrev} className="btn-ikincil">
            Geçen haftayı kopyala
          </button>
          <button onClick={() => setShowForm((s) => !s)} className="btn-birincil">
            + Personel
          </button>
        </div>
      </div>

      {/* Personel ekleme */}
      {showForm && (
        <div className="kart mt-4 p-4">
          <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr_1fr_auto]">
            <div>
              <label htmlFor="yeni-ad" className="etiket">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input
                id="yeni-ad"
                placeholder="Ayşe Yılmaz"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="giris mt-1"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="yeni-tel" className="etiket">
                Telefon
              </label>
              <input
                id="yeni-tel"
                placeholder="0532 111 22 33"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="giris mt-1"
                inputMode="tel"
              />
            </div>
            <div>
              <label htmlFor="yeni-gorev" className="etiket">
                Görev
              </label>
              <input
                id="yeni-gorev"
                placeholder="Barista, garson…"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="giris mt-1"
              />
            </div>
            <div className="flex items-end">
              <button onClick={handleAddEmployee} className="btn-birincil w-full sm:w-auto">
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hafta çubuğu */}
      <div className="sticky top-14 z-20 -mx-4 mt-5 border-y border-zinc-200 bg-zinc-50/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="btn-ikincil btn-kucuk"
            aria-label="Önceki hafta"
          >
            <OkIkon yon="sol" />
          </button>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="text-sm font-semibold">{formatWeekRange(weekDates)}</div>
            {weekOffset !== 0 ? (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-[11px] text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
              >
                Bu haftaya dön
              </button>
            ) : (
              <span className="text-[11px] text-zinc-500">Bu hafta</span>
            )}
          </div>

          <div className="mr-1 hidden items-center gap-3 border-r border-zinc-200 pr-3 text-xs text-zinc-500 lg:flex">
            <span>
              <strong className="font-semibold text-zinc-800">{summaryHours} sa</strong> toplam
            </span>
            <span>
              <strong className="font-semibold text-zinc-800">{calisanSayisi}</strong>/
              {data.employees.length} kişi
            </span>
            {uyariSayisi > 0 ? (
              <span className="font-medium text-amber-700">{uyariSayisi} uyarı</span>
            ) : (
              <span className="font-medium text-emerald-700">✓ uygun</span>
            )}
          </div>

          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="btn-ikincil btn-kucuk"
            aria-label="Sonraki hafta"
          >
            <OkIkon />
          </button>
        </div>
      </div>

      {/* Mobil özet (masaüstünde hafta çubuğunda görünür) */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 lg:hidden">
        <span>
          <strong className="font-semibold text-zinc-700">{summaryHours} sa</strong> toplam
        </span>
        <span>
          <strong className="font-semibold text-zinc-700">{calisanSayisi}</strong>/
          {data.employees.length} kişi
        </span>
        {uyariSayisi > 0 ? (
          <span className="font-medium text-amber-700">{uyariSayisi} uyarı</span>
        ) : (
          <span className="font-medium text-emerald-700">✓ uygun</span>
        )}
      </div>

      {/* Bugün — ince şerit */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
          Bugün
        </span>
        {data.shiftTemplates.map((t) => {
          const list = todayByShift.get(t.id) ?? [];
          if (list.length === 0) return null;
          return (
            <span
              key={t.id}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                COLOR_CLASSES[t.color]?.chip ?? ""
              }`}
            >
              <strong className="font-medium">{t.name}</strong>
              <span className="opacity-80">{list.map((e) => e.name).join(", ")}</span>
            </span>
          );
        })}
        {todayByShift.size === 0 && (
          <span className="text-sm text-zinc-500">Bugün için atanmış vardiya yok.</span>
        )}
        <Link
          href="/bugun"
          className="ml-auto text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
        >
          Tablet görünümü →
        </Link>
      </div>

      {/* Plan */}
      {weekEmpty ? (
        <div className="kart mt-4 border-dashed p-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-xl">
            🗓️
          </div>
          <h2 className="mt-4 text-lg font-semibold">Başlamaya hazırsın</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-zinc-600">
            Önce personelini ekle, sonra günlere vardiya seç. Hepsi bu.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <button onClick={() => setShowForm(true)} className="btn-birincil">
              + İlk personeli ekle
            </button>
            <button onClick={() => handleReset("demo")} className="btn-ikincil">
              Örnek veriyle dene
            </button>
          </div>
        </div>
      ) : (
        <div className="kart mt-4 overflow-hidden">
          <div className="kart-baslik">
            <div className="flex items-center gap-2">
              <h2 className="bolum-baslik">Haftalık plan</h2>
              <span className="text-xs text-zinc-400">·</span>
              <span className="text-xs text-zinc-500">
                {visibleEmployees.length} kişi
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Personel ara…"
                aria-label="Personel ara"
                className="giris h-8 w-32 py-1 sm:w-44"
              />
              <button onClick={() => setShowBulk(true)} className="btn-birincil btn-kucuk">
                Gönder
              </button>
              <details className="relative">
                <summary
                  className="btn-ikincil btn-kucuk cursor-pointer list-none px-2 [&::-webkit-details-marker]:hidden"
                  aria-label="Diğer işlemler"
                >
                  ⋯
                </summary>
                <div className="absolute right-0 z-30 mt-1 w-52 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg" onClick={kapatMenu}>
                  <Link
                    href="/yazdir"
                    className="block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
                  >
                    Yazdır / çizelge
                  </Link>
                  <button
                    onClick={exportCsv}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                  >
                    Excel (CSV) indir
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                  >
                    Ayarlar
                  </button>
                  <button
                    onClick={handleClearWeek}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Bu haftayı temizle
                  </button>
                </div>
              </details>
            </div>
          </div>

          {/* Masaüstü ızgara */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[840px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-500">
                  <th className="sticky left-0 z-10 bg-white px-4 py-2.5 text-left text-xs font-semibold">
                    Personel
                  </th>
                  {weekDates.map((d) => {
                    const iso = toISODate(d);
                    const holiday = getHoliday(iso);
                    const not = dayNoteMap.get(iso);
                    return (
                      <th key={iso} className="px-1.5 py-2 text-center text-xs font-semibold">
                        <span className={holiday ? "text-red-600" : "text-zinc-700"}>
                          {DAY_SHORT_TR[(d.getDay() + 6) % 7]}
                        </span>
                        <span className="mt-0.5 block text-[10px] font-normal text-zinc-400">
                          {formatShort(d)}
                        </span>
                        {holiday && (
                          <span
                            className="mt-0.5 block truncate text-[9px] font-normal text-red-500"
                            title={holiday.name}
                          >
                            {holiday.halfDay ? "Arife" : "Tatil"}
                          </span>
                        )}
                        <button
                          onClick={() => editDayNote(iso)}
                          title={not ?? "Gün notu ekle"}
                          aria-label={`${formatShort(d)} gün notu`}
                          className={`mx-auto mt-1 flex h-5 max-w-[104px] items-center gap-1 truncate rounded px-1 text-[10px] font-normal transition-colors ${
                            not
                              ? "text-amber-700 hover:bg-amber-50"
                              : "text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600"
                          }`}
                        >
                          <KalemIkon className="h-3 w-3 shrink-0" />
                          {not ? <span className="truncate">{not}</span> : null}
                        </button>
                      </th>
                    );
                  })}
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-zinc-500">
                    Toplam
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleEmployees.map((emp) => {
                  const total = weekTotal(emp);
                  const over = total > WEEKLY_LIMIT_HOURS;
                  const leaveLeft = emp.annualLeaveDays ?? 0;
                  const stat = empMonthStats.get(emp.id) ?? { hours: 0, days: 0 };
                  const acik = expandedEmpId === emp.id;
                  return (
                    <Fragment key={emp.id}>
                      <tr className={`border-t border-zinc-100 ${acik ? "bg-zinc-50/60" : ""}`}>
                        <td className="sticky left-0 z-10 bg-white px-4 py-2">
                          <button
                            type="button"
                            onClick={() => setExpandedEmpId(acik ? null : emp.id)}
                            className="flex w-full items-center gap-2 text-left"
                            title="Detayları göster/gizle"
                            aria-expanded={acik}
                          >
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                COLOR_CLASSES[emp.color]?.dot ?? "bg-zinc-400"
                              }`}
                            />
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-zinc-800">
                                {emp.name}
                              </span>
                              <span className="block truncate text-[11px] text-zinc-400">
                                {emp.role || "Görev yok"} · izin {leaveLeft} gün
                              </span>
                            </span>
                          </button>
                        </td>
                        {weekDates.map((d) => {
                          const iso = toISODate(d);
                          const shiftId = assignMap.get(keyOf(emp.id, iso)) ?? "";
                          const template = shiftId ? templateById.get(shiftId) : undefined;
                          const cls = template
                            ? COLOR_CLASSES[template.color]?.chip ?? ""
                            : "border-dashed border-zinc-200 bg-white text-zinc-400";
                          return (
                            <td key={iso} className="px-1.5 py-1.5">
                              <select
                                value={shiftId}
                                onChange={(e) => changeAssignment(emp.id, iso, e.target.value)}
                                aria-label={`${emp.name} ${formatShort(d)} vardiyası`}
                                className={`w-full min-w-[92px] cursor-pointer rounded-lg border px-2 py-1.5 text-[13px] outline-none transition-colors focus:ring-2 focus:ring-zinc-300 ${cls}`}
                              >
                                <option value="">—</option>
                                {data.shiftTemplates.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                          );
                        })}
                        <td className="whitespace-nowrap px-3 py-2 text-right">
                          <span
                            className={`font-semibold ${
                              over ? "text-red-600" : "text-zinc-700"
                            }`}
                          >
                            {total} sa
                          </span>
                          {over && (
                            <span className="ml-1 text-red-600" title={`${WEEKLY_LIMIT_HOURS} saati aştı`}>
                              ⚠
                            </span>
                          )}
                          {empOvertime(emp) > 0 && (
                            <span className="block text-[10px] text-amber-600">
                              +{empOvertime(emp)} sa fazla
                            </span>
                          )}
                        </td>
                      </tr>

                      {acik && (
                        <tr className="border-t border-zinc-100 bg-zinc-50/60">
                          <td colSpan={weekDates.length + 2} className="px-4 py-3">
                            {editingEmpId === emp.id ? (
                              <div className="flex flex-wrap items-end gap-2">
                                <div>
                                  <label className="etiket" htmlFor={`ad-${emp.id}`}>
                                    Ad
                                  </label>
                                  <input
                                    id={`ad-${emp.id}`}
                                    value={empDraft.name}
                                    onChange={(e) =>
                                      setEmpDraft({ ...empDraft, name: e.target.value })
                                    }
                                    className="giris h-8 w-40 py-1"
                                  />
                                </div>
                                <div>
                                  <label className="etiket" htmlFor={`gorev-${emp.id}`}>
                                    Görev
                                  </label>
                                  <input
                                    id={`gorev-${emp.id}`}
                                    value={empDraft.role}
                                    onChange={(e) =>
                                      setEmpDraft({ ...empDraft, role: e.target.value })
                                    }
                                    className="giris h-8 w-32 py-1"
                                  />
                                </div>
                                <div>
                                  <label className="etiket" htmlFor={`tel-${emp.id}`}>
                                    Telefon
                                  </label>
                                  <input
                                    id={`tel-${emp.id}`}
                                    value={empDraft.phone}
                                    onChange={(e) =>
                                      setEmpDraft({ ...empDraft, phone: e.target.value })
                                    }
                                    className="giris h-8 w-36 py-1"
                                    inputMode="tel"
                                  />
                                </div>
                                <div>
                                  <label className="etiket" htmlFor={`izin-${emp.id}`}>
                                    Yıllık izin
                                  </label>
                                  <input
                                    id={`izin-${emp.id}`}
                                    value={empDraft.annualLeaveDays}
                                    onChange={(e) =>
                                      setEmpDraft({ ...empDraft, annualLeaveDays: e.target.value })
                                    }
                                    className="giris h-8 w-20 py-1"
                                    inputMode="numeric"
                                  />
                                </div>
                                <button onClick={saveEmp} className="btn-birincil btn-kucuk">
                                  Kaydet
                                </button>
                                <button
                                  onClick={() => setEditingEmpId(null)}
                                  className="btn-ikincil btn-kucuk"
                                >
                                  Vazgeç
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-600">
                                {emp.phone ? <span>📞 {emp.phone}</span> : null}
                                <span>
                                  Bu ay: <strong className="text-zinc-800">{Math.round(stat.hours * 10) / 10} sa</strong>{" "}
                                  · {stat.days} gün
                                </span>
                                <span>
                                  Bu hafta:{" "}
                                  <strong className="text-zinc-800">
                                    {(() => {
                                      const gunler = calistigiGunler(emp);
                                      return gunler.length ? gunler.join(", ") : "atanmamış";
                                    })()}
                                  </strong>
                                </span>
                                <span className="ml-auto flex flex-wrap gap-1.5">
                                  <button onClick={() => sendWhatsApp(emp)} className="btn-birincil btn-kucuk">
                                    WhatsApp
                                  </button>
                                  <button onClick={() => copySchedule(emp)} className="btn-ikincil btn-kucuk">
                                    Kopyala
                                  </button>
                                  <button onClick={() => copyStaffLink(emp)} className="btn-ikincil btn-kucuk">
                                    Link
                                  </button>
                                  <button onClick={() => startEditEmp(emp)} className="btn-ikincil btn-kucuk">
                                    Düzenle
                                  </button>
                                  <button onClick={() => handleRemoveEmployee(emp)} className="btn-tehlike btn-kucuk">
                                    Sil
                                  </button>
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {visibleEmployees.length === 0 && (
                  <tr>
                    <td
                      colSpan={weekDates.length + 2}
                      className="px-4 py-10 text-center text-sm text-zinc-500"
                    >
                      Aramanla eşleşen personel yok.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-100 bg-zinc-50 text-[11px] text-zinc-500">
                  <td className="sticky left-0 z-10 bg-zinc-50 px-4 py-2 font-medium">
                    Günlük kapsam
                  </td>
                  {dayCounts.map((c, i) => (
                    <td
                      key={i}
                      className={`px-1.5 py-2 text-center font-medium ${
                        c === 0 ? "text-red-500" : "text-zinc-600"
                      }`}
                    >
                      {c}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right text-zinc-400">{summaryHours} sa</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobil liste */}
          <div className="divide-y divide-zinc-100 sm:hidden">
            {visibleEmployees.map((emp) => {
              const total = weekTotal(emp);
              const over = total > WEEKLY_LIMIT_HOURS;
              return (
                <details key={emp.id} className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        COLOR_CLASSES[emp.color]?.dot ?? "bg-zinc-400"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{emp.name}</span>
                      <span className="block truncate text-[11px] text-zinc-400">
                        {emp.role || "Görev yok"} · izin {emp.annualLeaveDays ?? 0} gün
                      </span>
                    </span>
                    <span className={`text-sm font-semibold ${over ? "text-red-600" : "text-zinc-700"}`}>
                      {total} sa
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4 text-zinc-400 transition-transform group-open:rotate-180"
                      aria-hidden
                    >
                      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>

                  <div className="space-y-1.5 px-4 pb-4">
                    {weekDates.map((d) => {
                      const iso = toISODate(d);
                      const shiftId = assignMap.get(keyOf(emp.id, iso)) ?? "";
                      const template = shiftId ? templateById.get(shiftId) : undefined;
                      const cls = template
                        ? COLOR_CLASSES[template.color]?.chip ?? ""
                        : "border-dashed border-zinc-200 bg-white text-zinc-400";
                      return (
                        <div key={iso} className="flex items-center gap-2">
                          <span className="w-[74px] shrink-0 text-xs text-zinc-500">
                            {DAY_SHORT_TR[(d.getDay() + 6) % 7]} {formatShort(d)}
                          </span>
                          <select
                            value={shiftId}
                            onChange={(e) => changeAssignment(emp.id, iso, e.target.value)}
                            aria-label={`${emp.name} ${formatShort(d)} vardiyası`}
                            className={`h-9 min-w-0 flex-1 rounded-lg border px-2 text-[13px] outline-none ${cls}`}
                          >
                            <option value="">—</option>
                            {data.shiftTemplates.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => editDayNote(iso)}
                            aria-label={`${formatShort(d)} gün notu`}
                            title={dayNoteMap.get(iso) ?? "Gün notu"}
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${
                              dayNoteMap.get(iso)
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-transparent text-zinc-300 hover:bg-zinc-100"
                            }`}
                          >
                            <KalemIkon />
                          </button>
                        </div>
                      );
                    })}

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      <button onClick={() => sendWhatsApp(emp)} className="btn-birincil btn-kucuk">
                        WhatsApp
                      </button>
                      <button onClick={() => startEditEmp(emp)} className="btn-ikincil btn-kucuk">
                        Düzenle
                      </button>
                      <button onClick={() => copyStaffLink(emp)} className="btn-ikincil btn-kucuk">
                        Link
                      </button>
                      <button onClick={() => handleRemoveEmployee(emp)} className="btn-tehlike btn-kucuk">
                        Sil
                      </button>
                    </div>
                  </div>
                </details>
              );
            })}
            {visibleEmployees.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-zinc-500">
                Aramanla eşleşen personel yok.
              </p>
            )}
          </div>
        </div>
      )}

      {!weekEmpty && uyariSayisi === 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
          <span aria-hidden>✓</span> Bu hafta mevzuat ve kapsam uyarısı yok.
        </p>
      )}

      {/* Uyarılar — yalnızca varsa */}
      {uyariSayisi > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900">
            Uyarılar ({uyariSayisi})
          </h3>
          {issues.length > 0 && (
            <ul className="mt-2 space-y-1.5 text-sm">
              {issues.map((it, idx) => {
                const emp = empById.get(it.employeeId);
                const isErr = it.severity === "error";
                return (
                  <li key={`${it.employeeId}-${it.type}-${it.date}-${idx}`} className="flex gap-2">
                    <span aria-hidden className={isErr ? "text-red-600" : "text-amber-600"}>
                      {isErr ? "⛔" : "⚠"}
                    </span>
                    <span className="text-amber-900">
                      <strong>{emp?.name ?? "Bilinmeyen"}</strong>{" "}
                      <span className={isErr ? "text-red-700" : ""}>{it.message}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {coverageIssues.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-amber-200 pt-2 text-sm text-amber-900">
              {coverageIssues.map((c, i) => {
                const t = templateById.get(c.templateId);
                const day = new Date(c.date + "T00:00:00");
                return (
                  <li key={i}>
                    <strong>{formatShort(day)}</strong> · {t?.name ?? "?"}: {c.have}/{c.need} kişi
                    <span className="text-amber-700"> (eksik {c.need - c.have})</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Site trafiği — yalnızca site sahibi görür */}
      {ziyaret && (
        <div className="kart mt-4 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="bolum-baslik">Site trafiği</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Çerezsiz sayaç · IP saklanmaz · 120 gün sonra silinir
              </p>
            </div>
            <Link
              href="/gizlilik"
              className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
            >
              Nasıl sayılıyor?
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { etiket: "bugün", deger: ziyaret.bugun },
              { etiket: "son 7 gün", deger: ziyaret.hafta },
              { etiket: "bu ay", deger: ziyaret.ay },
            ].map((k) => (
              <div key={k.etiket} className="rounded-xl bg-zinc-50 px-2 py-3">
                <div className="text-2xl font-semibold tabular-nums">{k.deger}</div>
                <div className="mt-0.5 text-[11px] text-zinc-500">{k.etiket}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alt bölüm: duyurular + ayarlar */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Duyurular */}
        <details className="kart self-start" open={data.announcements.length > 0}>
          <summary className="kart-baslik cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <div>
              <h2 className="bolum-baslik">Duyurular</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {data.announcements.length > 0
                  ? `${data.announcements.length} yayında`
                  : "Ekibe kısa bir mesaj bırak"}
              </p>
            </div>
            <span className="text-xs font-medium text-zinc-500">Aç / kapat</span>
          </summary>
          <div className="border-t border-zinc-100 p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={announcementDraft}
                onChange={(e) => setAnnouncementDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") postAnnouncement();
                }}
                placeholder="Ör. Cumartesi canlı müzik var"
                aria-label="Duyuru metni"
                className="giris flex-1"
              />
              <button onClick={postAnnouncement} className="btn-birincil">
                Yayınla
              </button>
            </div>
            {data.announcements.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {data.announcements.slice(0, 5).map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                  >
                    <span className="text-zinc-700">{a.message}</span>
                    <button
                      onClick={() => removeAnnouncement(a.id)}
                      className="shrink-0 text-xs text-zinc-400 hover:text-red-600"
                    >
                      Sil
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>

        {/* Şablonlar + standart */}
        <div className="kart overflow-hidden">
          <div className="kart-baslik">
            <div>
              <h2 className="bolum-baslik">Vardiya şablonları</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {data.shiftTemplates.length} şablon · {data.business.openTime}–{data.business.closeTime}
              </p>
            </div>
            <button
              onClick={() => setShowTemplates((s) => !s)}
              className="btn-ikincil btn-kucuk"
            >
              {showTemplates ? "Kapat" : "Yönet"}
            </button>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-1.5">
              {data.shiftTemplates.map((t) => (
                <span
                  key={t.id}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${
                    COLOR_CLASSES[t.color]?.chip ?? ""
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${COLOR_CLASSES[t.color]?.dot ?? ""}`} />
                  {t.name} · {t.start}–{t.end}
                </span>
              ))}
            </div>

            {showTemplates && (
              <div className="mt-4">
                <TemplateManager
                  templates={data.shiftTemplates}
                  standart={{ openTime: data.business.openTime, closeTime: data.business.closeTime }}
                  onChanged={load}
                  gomulu
                />
              </div>
            )}

            <div className="mt-4 border-t border-zinc-100 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-zinc-500">
                  Standart mesai:{" "}
                  <strong className="text-zinc-700">
                    {data.business.openTime} – {data.business.closeTime}
                  </strong>
                </p>
                <button
                  type="button"
                  onClick={() => setShowStandart((s) => !s)}
                  className="btn-sessiz btn-kucuk"
                >
                  {showStandart ? "Kapat" : "Mesai saati ayarla"}
                </button>
              </div>

              {showStandart && (
                <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="text-xs text-zinc-600">
                      <span className="block">Açılış</span>
                      <input
                        type="time"
                        value={acilisDraft}
                        onChange={(e) => setAcilisDraft(e.target.value)}
                        className="giris mt-1 w-28"
                      />
                    </label>
                    <label className="text-xs text-zinc-600">
                      <span className="block">Kapanış</span>
                      <input
                        type="time"
                        value={kapanisDraft}
                        onChange={(e) => setKapanisDraft(e.target.value)}
                        className="giris mt-1 w-28"
                      />
                    </label>
                    <button type="button" onClick={standartKaydet} className="btn-birincil btn-kucuk">
                      Kaydet
                    </button>
                    <button
                      type="button"
                      onClick={sablonlariStandartaUydur}
                      className="btn-ikincil btn-kucuk"
                    >
                      Şablonları uydur
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-500">
                    &quot;Şablonları uydur&quot; Sabah / Akşam / Tam Gün / Ara saatlerini günceller;
                    mevcut atamalar silinmez.
                  </p>
                </div>
              )}
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-zinc-400">
              Denetim: haftalık {WEEKLY_LIMIT_HOURS} saat, iki vardiya arası en az{" "}
              {MIN_DAILY_REST_HOURS} saat dinlenme (İş Kanunu 4857).
            </p>
          </div>
        </div>
      </div>

      {/* Ayarlar modali */}
      <Modal
        acik={showSettings}
        kapat={() => setShowSettings(false)}
        baslik="Ayarlar"
      >
        <p className="text-sm text-zinc-500">
          Veri işlemleri. İşletme adını üstteki başlıktan değiştirebilirsin.
        </p>
        <div className="mt-4 space-y-2">
          <button
            onClick={() => handleReset("demo")}
            className="btn-ikincil w-full justify-start"
          >
            Örnek veriyi (demo) yükle
          </button>
          <button
            onClick={() => handleReset("empty")}
            className="btn-tehlike w-full justify-start"
          >
            Boş başla (tüm personeli sil)
          </button>
        </div>
      </Modal>

      {/* Toplu gönderim modali */}
      <Modal
        acik={showBulk}
        kapat={() => setShowBulk(false)}
        baslik="Tüm personele gönder"
      >
        <p className="text-sm text-zinc-500">
          Her personele kendi programı hazırlanır. Sırayla açıp gönder.
        </p>
        <ul className="mt-3 max-h-80 space-y-1.5 overflow-y-auto">
          {data.employees.map((emp) => {
            const text = buildScheduleText(
              emp,
              weekDates,
              Object.fromEntries([...assignMap.entries()]),
              data.shiftTemplates,
              data.business.name
            );
            const link = buildWhatsAppLink(emp.phone, text);
            return (
              <li
                key={emp.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              >
                <span className="truncate">{emp.name}</span>
                {emp.phone ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-birincil btn-kucuk"
                  >
                    WhatsApp
                  </a>
                ) : (
                  <span className="text-xs text-zinc-400">telefon yok</span>
                )}
              </li>
            );
          })}
        </ul>
      </Modal>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg sm:bottom-6"
        >
          {toast}
        </div>
      )}
    </main>
  );
}
