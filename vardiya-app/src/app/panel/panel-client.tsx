"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Employee, StatePayload } from "@/lib/types";
import {
  addEmployee as apiAddEmployee,
  addEmployeesBulk as apiAddEmployeesBulk,
  clearWeek as apiClearWeek,
  copyWeek as apiCopyWeek,
  createAnnouncement as apiCreateAnnouncement,
  deleteAnnouncement as apiDeleteAnnouncement,
  deleteEmployee as apiDeleteEmployee,
  fetchState,
  publishWeek as apiPublishWeek,
  resetData as apiResetData,
  setAssignment as apiSetAssignment,
  setDayNote as apiSetDayNote,
  unpublishWeek as apiUnpublishWeek,
  updateBusiness as apiUpdateBusiness,
  updateEmployee as apiUpdateEmployee,
  updateTemplate as apiUpdateTemplate,
} from "@/lib/api-client";
import { addDays, formatShort, formatWeekRange, getWeekDates, toISODate, DAY_SHORT_TR } from "@/lib/dates";
import { shiftHours, shiftSaatMetni, WEEKLY_LIMIT_HOURS, standartSablonlar } from "@/lib/shifts";
import { analyzeWeek, MIN_DAILY_REST_HOURS } from "@/lib/compliance";
import { COLOR_CLASSES } from "@/lib/colors";
import { buildScheduleText, buildWhatsAppLink } from "@/lib/whatsapp";
import TemplateManager from "@/components/TemplateManager";
import Modal from "@/components/Modal";
import { csvIndir } from "@/lib/csv";
import { getHoliday } from "@/lib/holidays";
import { dosyaKabulEdilir, parseEmployeeText } from "@/lib/personel-aktarim";

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
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [importDosyaAdi, setImportDosyaAdi] = useState("");
  const importDosya = useRef<HTMLInputElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPersonel, setShowPersonel] = useState(false);
  const [showStandart, setShowStandart] = useState(false);
  const [acilisDraft, setAcilisDraft] = useState(initialData.business.openTime);
  const [kapanisDraft, setKapanisDraft] = useState(initialData.business.closeTime);
  const [search, setSearch] = useState("");
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", role: "" });
  const [nameDraft, setNameDraft] = useState(initialData.business.name);
  const [nameEdit, setNameEdit] = useState(false);
  const [toast, setToast] = useState("");
  /** Hızlı doldurma fırçası: seçili şablon kimliği veya "sil". */
  const [firca, setFirca] = useState<string | "sil" | null>(null);
  /** Yalnızca süre uyarısı olan personeli göster. */
  const [sadeceUyarili, setSadeceUyarili] = useState(false);
  /** Kaydetme durumu: hücre değişikliklerinde küçük geri bildirim. */
  const [kayitDurumu, setKayitDurumu] = useState<"bos" | "yaziyor" | "tamam">("bos");
  /** Uyarıdan satıra atlarken kısa süreli vurgu. */
  const [vurgu, setVurgu] = useState<string | null>(null);
  const kayitZaman = useRef<number | null>(null);
  /**
   * Yayınlanmış bir haftada değişiklik yapıldıysa o haftanın başlangıcı.
   * "Yayınlanmamış değişiklik var" uyarısını göstermek için kullanılır.
   */
  const [degisenHafta, setDegisenHafta] = useState<string | null>(null);
  /** Yayınla / geri al işlemi sürüyor mu? */
  const [yayinBusy, setYayinBusy] = useState(false);
  /** "E-postaya gönder" işlemi sürüyor mu? */
  const [postaBusy, setPostaBusy] = useState(false);

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
      setFirca(null);
    }
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, []);

  // Hafta değişince fırça kapanmalı (yanlış haftaya boyamayı önler).
  // Not: bunu effect ile yapmak yerine hafta gezinme eylemlerinde sıfırlıyoruz —
  // böylece fazladan render tetiklenmez.
  const haftaGit = useCallback((offset: number | "bu") => {
    setFirca(null);
    setWeekOffset(offset === "bu" ? 0 : (w) => w + offset);
  }, []);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const weekISOList = useMemo(() => weekDates.map((d) => toISODate(d)), [weekDates]);
  /** Gösterilen haftanın pazartesi günü — yayın durumu bununla tutulur. */
  const weekISO = weekISOList[0];
  const yayinliHaftalar = data?.publishedWeeks ?? [];
  const buHaftaYayinda = yayinliHaftalar.includes(weekISO);
  /** Yayınlanmış haftada son yayından sonra değişiklik yapıldı mı? */
  const yayinlanmamisDegisiklik = degisenHafta === weekISO;

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

  /** Gösterilen haftadaki toplam atama (vardiya) sayısı. */
  const haftaAtamaSayisi = useMemo(() => {
    const gunler = new Set(weekISOList);
    return data?.assignments.filter((a) => gunler.has(a.date)).length ?? 0;
  }, [data, weekISOList]);

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

  // Geçen haftanın toplamı: KPI kartında "geçen haftaya göre" farkı için.
  const oncekiHafta = useMemo(() => {
    if (!data) return null;
    const gecen = weekDates.map((d) => toISODate(addDays(d, -7)));
    return analyzeWeek({
      employees: data.employees.map((e) => ({ id: e.id, name: e.name })),
      shifts: data.shiftTemplates,
      assignments: data.assignments,
      weekDates: gecen,
      previousDate: toISODate(addDays(weekDates[0], -8)),
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
    setKayitDurumu("yaziyor");
    try {
      await apiSetAssignment(employeeId, iso, shiftTemplateId);
      setKayitDurumu("tamam");
      // Yayınlanmış haftada değişiklik yapıldıysa hatırlat: yeniden yayınlanmalı.
      if (buHaftaYayinda) setDegisenHafta(weekISO);
      if (kayitZaman.current) window.clearTimeout(kayitZaman.current);
      kayitZaman.current = window.setTimeout(() => setKayitDurumu("bos"), 2000);
    } catch {
      flash("Kaydedilemedi, yeniden deneniyor…");
      setKayitDurumu("bos");
      load();
    }
  }

  /** Gösterilen haftayı ekibe açar (personel linki + .ics görür). */
  async function haftaYayinla() {
    if (yayinBusy) return;
    if (haftaAtamaSayisi === 0) {
      flash("Bu haftada vardiya yok — önce planı doldur.");
      return;
    }
    setYayinBusy(true);
    try {
      await apiPublishWeek(weekISO);
      setDegisenHafta(null);
      await load();
      flash("Plan yayınlandı — ekip artık görebilir.");
    } catch {
      flash("Yayınlanamadı, tekrar dene.");
    } finally {
      setYayinBusy(false);
    }
  }

  /** Yayını geri alır: hafta yeniden taslak olur, ekibe görünmez. */
  async function haftaYayininiGeriAl() {
    if (yayinBusy) return;
    setYayinBusy(true);
    try {
      await apiUnpublishWeek(weekISO);
      await load();
      flash("Yayın geri alındı — bu hafta taslak.");
    } catch {
      flash("Geri alınamadı, tekrar dene.");
    } finally {
      setYayinBusy(false);
    }
  }

  /** Planı PDF olarak hesabın kendi e-postasına gönderir. */
  async function planPdfGonder() {
    if (postaBusy) return;
    setPostaBusy(true);
    try {
      const res = await fetch(`/api/plan/pdf?hafta=${weekISO}`, { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { kime?: string; hata?: string };
      if (!res.ok) throw new Error(json.hata ?? "Gönderilemedi.");
      flash(`PDF gönderildi: ${json.kime ?? "e-posta adresin"}`);
    } catch (e) {
      flash(e instanceof Error ? e.message : "Gönderilemedi.");
    } finally {
      setPostaBusy(false);
    }
  }

  /** Uyarıdan ilgili personelin satırına atla ve kısa süre vurgula. */
  function uyariyaGit(employeeId: string, date: string) {    setExpandedEmpId(employeeId);
    setVurgu(`${employeeId}__${date}`);
    document
      .getElementById(`satir-${employeeId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => setVurgu(null), 2400);
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

  async function handleImportDosya(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    if (!dosyaKabulEdilir(dosya.name)) {
      flash("Yalnızca .csv, .tsv veya .txt yükleyebilirsin.");
      return;
    }
    try {
      setImportText(await dosya.text());
      setImportDosyaAdi(dosya.name);
    } catch {
      flash("Dosya okunamadı.");
    } finally {
      if (importDosya.current) importDosya.current.value = "";
    }
  }

  async function handleImport() {
    const list = parseEmployeeText(importText);
    if (list.length === 0) return flash("İçe aktarılacak personel bulunamadı.");
    setImportBusy(true);
    try {
      const res = await apiAddEmployeesBulk(list);
      await load();
      setShowImport(false);
      setImportText("");
      setImportDosyaAdi("");
      flash(`${res.created} personel içe aktarıldı.`);
    } catch {
      flash("İçe aktarma başarısız.");
    } finally {
      setImportBusy(false);
    }
  }

  async function handleRemoveEmployee(emp: Employee) {
    if (!window.confirm(`${emp.name} çıkarılsın mı? Vardiyaları da silinir.`)) return;
    if (editingEmpId === emp.id) setEditingEmpId(null);
    if (expandedEmpId === emp.id) setExpandedEmpId(null);
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
      // Yayınlanmış haftaya kopyalandıysa yeniden yayınlanmalı.
      if (buHaftaYayinda) setDegisenHafta(toISO);
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
      if (buHaftaYayinda) setDegisenHafta(toISO);
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
        return t ? `${t.name} ${shiftSaatMetni(t)}` : "";
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
    try {
      const r = await fetch(`/api/baglanti/${emp.id}`, { cache: "no-store" });
      const j = (await r.json().catch(() => ({}))) as { yol?: string | null; aktif?: boolean };
      if (!r.ok) return flash("Bağlantı alınamadı.");
      if (!j.aktif || !j.yol) {
        return flash("Bu personelin bağlantısı kapalı. 'Yenile' ile yeni link oluştur.");
      }
      await navigator.clipboard.writeText(`${window.location.origin}${j.yol}`);
      flash("Personel linki kopyalandı.");
    } catch {
      flash("Kopyalanamadı.");
    }
  }

  /** Personel linkini yenile / kapat / yeniden aç. */
  async function linkIslem(emp: Employee, islem: "yenile" | "kapat" | "ac") {
    if (islem === "kapat" && !window.confirm(`${emp.name} için link kapatılsın mı? Elindeki bağlantı çalışmayacak.`)) {
      return;
    }
    try {
      const r = await fetch(`/api/baglanti/${emp.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ islem }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        yol?: string | null;
        hata?: string;
      };
      if (!r.ok) return flash(j.hata ?? "İşlem yapılamadı.");

      if (islem === "kapat") {
        flash("Link kapatıldı. Personel artık açamaz.");
        return;
      }
      if (j.yol) {
        await navigator.clipboard.writeText(`${window.location.origin}${j.yol}`).catch(() => {});
      }
      flash(
        islem === "yenile"
          ? "Yeni link kopyalandı; eski link geçersiz."
          : "Link yeniden açıldı ve kopyalandı."
      );
    } catch {
      flash("İşlem yapılamadı.");
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
  const hataSayisi = issues.filter((i) => i.severity === "error").length;
  const oncekiSaat = oncekiHafta
    ? Math.round(
        [...oncekiHafta.perEmployee.values()].reduce((s, e) => s + e.weeklyHours, 0)
      )
    : 0;
  const saatFarki = summaryHours - oncekiSaat;
  const bugunKisi = [...todayByShift.values()].reduce((n, list) => n + list.length, 0);
  const bugunEtiket = new Date(`${todayISO}T00:00:00`).toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const uyariliIdler = new Set(issues.map((i) => i.employeeId));

  /**
   * "Şimdi ne yapmalıyım?" — panelin her durumda tek bir sonraki adım
   * önermesi için hesaplanır (patron isteği: teknik terim yok, tek cevap).
   */
  const sonrakiAdim: {
    baslik: string;
    aciklama: string;
    etiket: string;
    calistir: () => void;
    ikincil?: boolean;
  } = (() => {
    if (data.employees.length === 0) {
      return {
        baslik: "İlk adım: personelini ekle",
        aciklama: "Plan yapmak için en az bir çalışan gerekiyor. Sadece isim yeterli.",
        etiket: "+ Personel ekle",
        calistir: () => setShowForm(true),
      };
    }
    if (haftaAtamaSayisi === 0) {
      return {
        baslik: "Bu hafta henüz plan yok",
        aciklama:
          "Aşağıdaki ızgarada gün hücrelerine vardiya seç ya da “Hızlı doldur” fırçasını kullan.",
        etiket: "Planı doldur",
        calistir: () => {
          document
            .getElementById("hafta-plani")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        },
      };
    }
    if (!buHaftaYayinda) {
      return {
        baslik: "Plan hazır — yayınla",
        aciklama:
          "Yayınlayana kadar bu planı yalnızca sen görürsün; personel linki ve takvim göstermez.",
        etiket: "Planı yayınla",
        calistir: haftaYayinla,
      };
    }
    if (yayinlanmamisDegisiklik) {
      return {
        baslik: "Yayınlanmamış değişiklik var",
        aciklama: "Haftayı yayınladıktan sonra düzenleme yaptın. Ekip yeni hâlini görsün mü?",
        etiket: "Değişiklikleri yayınla",
        calistir: haftaYayinla,
      };
    }
    if (uyariSayisi > 0) {
      return {
        baslik: `${uyariSayisi} uyarı var`,
        aciklama: "Süre veya kapsam uyarılarını gözden geçir; tek tıkla ilgili satıra gidersin.",
        etiket: "Uyarıları göster",
        calistir: () => setSadeceUyarili(true),
      };
    }
    return {
      baslik: "Her şey hazır",
      aciklama: "Plan yayında ve uyarı yok. Şimdi ekibe gönderebilir ya da PDF alabilirsin.",
      etiket: "Ekibe mesaj gönder",
      calistir: () => setShowBulk(true),
    };
  })();

  const visibleEmployees = data.employees.filter((e) => {
    const q = search.trim().toLowerCase();
    if (q && !(e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q))) {
      return false;
    }
    if (sadeceUyarili && !uyariliIdler.has(e.id)) return false;
    return true;
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
          <button onClick={() => setShowImport(true)} className="btn-ikincil">
            Excel&apos;den aktar
          </button>
          <button onClick={() => setShowForm((s) => !s)} className="btn-birincil">
            + Personel
          </button>
        </div>
      </div>

      {/* Hafta özeti — panelin ilk bakışta okunan dört sayısı */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <div className="kart p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
              Planlanan saat
            </p>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 text-zinc-300" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900">
            {summaryHours}
            <span className="ml-1 text-sm font-normal text-zinc-400">sa</span>
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {oncekiSaat > 0 ? (
              saatFarki === 0 ? (
                "Geçen haftayla aynı"
              ) : (
                <>
                  <span
                    className={
                      saatFarki > 0 ? "font-medium text-amber-700" : "font-medium text-emerald-700"
                    }
                  >
                    {saatFarki > 0 ? "+" : "−"}
                    {Math.abs(saatFarki)} sa
                  </span>{" "}
                  geçen haftaya göre
                </>
              )
            ) : (
              "Geçen hafta planı yok"
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPersonel(true)}
          title="Personel listesini aç — düzenle veya çıkar"
          className="kart p-4 text-left transition-colors hover:border-zinc-300"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
              Çalışan
            </p>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 text-zinc-300" aria-hidden>
              <circle cx="9" cy="8" r="3" />
              <path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M18 20a6 6 0 0 0-3-5.2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900">
            {calisanSayisi}
            <span className="ml-0.5 text-sm font-normal text-zinc-400">
              /{data.employees.length}
            </span>
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {data.employees.length === 0
              ? "Henüz personel yok"
              : calisanSayisi === data.employees.length
                ? "Bu hafta herkese vardiya var"
                : `${data.employees.length - calisanSayisi} kişi boşta`}
            <span className="text-zinc-400"> · Yönet</span>
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSadeceUyarili((v) => !v)}
          disabled={uyariSayisi === 0}
          aria-pressed={sadeceUyarili}
          title={
            uyariSayisi > 0
              ? "Yalnızca süre uyarısı olan personeli göster"
              : "Bu hafta uyarı yok"
          }
          className={`kart p-4 text-left transition-colors disabled:cursor-default ${
            uyariSayisi > 0 ? "border-amber-200 bg-amber-50/60 hover:border-amber-300" : ""
          } ${sadeceUyarili ? "ring-2 ring-amber-400" : ""}`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
              Uyarı
            </p>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 text-zinc-300" aria-hidden>
              <path d="M12 4 3 20h18L12 4Z" strokeLinejoin="round" />
              <path d="M12 10v4M12 17.2v.1" strokeLinecap="round" />
            </svg>
          </div>
          <p className={`mt-2 text-2xl font-semibold tabular-nums ${uyariSayisi > 0 ? "text-amber-900" : "text-zinc-900"}`}>
            {uyariSayisi}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {uyariSayisi === 0
              ? "Süre ve kapsam temiz"
              : `${hataSayisi} hata · ${issues.length - hataSayisi} uyarı${
                  coverageIssues.length > 0 ? ` · ${coverageIssues.length} kapsam` : ""
                }`}
          </p>
        </button>

        <div className="kart p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
              Bugün
            </p>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 text-zinc-300" aria-hidden>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900">
            {bugunKisi}
            <span className="ml-1 text-sm font-normal text-zinc-400">kişi</span>
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {todayByShift.size} vardiya · {bugunEtiket}
          </p>
        </div>
      </div>

      {/* Sıradaki adım — panelin tek cevabı */}
      <div className="kart mt-3 flex flex-col gap-3 border-amber-200 bg-amber-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
              <path d="M12 3v3M12 18v3M4.2 7.5l2.6 1.5M17.2 15l2.6 1.5M4.2 16.5l2.6-1.5M17.2 9l2.6-1.5" strokeLinecap="round" />
              <circle cx="12" cy="12" r="3.2" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-amber-800/80">
              Şimdi ne yapmalıyım?
            </p>
            <p className="mt-0.5 text-sm font-semibold text-zinc-900">{sonrakiAdim.baslik}</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-zinc-600">
              {sonrakiAdim.aciklama}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {buHaftaYayinda && haftaAtamaSayisi > 0 ? (
            <>
              <a
                href={`/api/plan/pdf?hafta=${weekISO}`}
                className="btn-ikincil btn-kucuk"
                download
              >
                PDF indir
              </a>
              <button
                type="button"
                onClick={planPdfGonder}
                disabled={postaBusy}
                className="btn-ikincil btn-kucuk disabled:opacity-60"
              >
                {postaBusy ? "Gönderiliyor…" : "E-postaya gönder"}
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={sonrakiAdim.calistir}
            disabled={yayinBusy}
            className="btn-birincil disabled:opacity-60"
          >
            {sonrakiAdim.etiket}
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
            onClick={() => haftaGit(-1)}
            className="btn-ikincil btn-kucuk"
            aria-label="Önceki hafta"
          >
            <OkIkon yon="sol" />
          </button>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="text-sm font-semibold">{formatWeekRange(weekDates)}</div>
            {weekOffset !== 0 ? (
              <button
                onClick={() => haftaGit("bu")}
                className="text-[11px] text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
              >
                Bu haftaya dön
              </button>
            ) : (
              <span className="text-[11px] text-zinc-500">Bu hafta</span>
            )}
          </div>

          <div
            className="mr-1 hidden min-w-[96px] items-center justify-end gap-1.5 border-r border-zinc-200 pr-3 text-[11px] text-zinc-500 sm:flex"
            aria-live="polite"
          >
            {kayitDurumu === "yaziyor" ? (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                Kaydediliyor…
              </>
            ) : kayitDurumu === "tamam" ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Kaydedildi
              </>
            ) : (
              <span className="text-zinc-400">Otomatik kayıt</span>
            )}
          </div>

          <button
            onClick={() => haftaGit(1)}
            className="btn-ikincil btn-kucuk"
            aria-label="Sonraki hafta"
          >
            <OkIkon />
          </button>
        </div>

        {/* Taslak / yayında durumu — ekibe görünürlüğü belirler */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 border-t border-zinc-200/70 pt-1.5">
          {buHaftaYayinda ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Yayında · ekip görüyor
              {yayinlanmamisDegisiklik ? " · yayınlanmamış değişiklik var" : ""}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              Taslak · ekibe görünmüyor
            </span>
          )}

          {!buHaftaYayinda || yayinlanmamisDegisiklik ? (
            <button
              onClick={haftaYayinla}
              disabled={yayinBusy || haftaAtamaSayisi === 0}
              className="btn-birincil btn-kucuk disabled:opacity-50"
              title={
                haftaAtamaSayisi === 0
                  ? "Önce bu haftaya vardiya ekle"
                  : "Bu haftayı personel linkinde ve takvimde görünür yap"
              }
            >
              {yayinBusy ? "Yayınlanıyor…" : buHaftaYayinda ? "Değişiklikleri yayınla" : "Planı yayınla"}
            </button>
          ) : (
            <button
              onClick={haftaYayininiGeriAl}
              disabled={yayinBusy}
              className="btn-sessiz btn-kucuk disabled:opacity-60"
              title="Haftayı yeniden taslağa al — ekibe görünmez"
            >
              Yayını geri al
            </button>
          )}
        </div>
      </div>

      {/* Mobil özet + filtre durumu */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
        {sadeceUyarili ? (
          <>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-900">
              Yalnızca uyarısı olanlar
            </span>
            <button
              onClick={() => setSadeceUyarili(false)}
              className="underline underline-offset-2 hover:text-zinc-900"
            >
              Filtreyi kaldır
            </button>
          </>
        ) : (
          <span className="text-zinc-400 sm:hidden">
            {summaryHours} sa · {calisanSayisi}/{data.employees.length} kişi
            {uyariSayisi > 0 ? ` · ${uyariSayisi} uyarı` : ""}
          </span>
        )}
      </div>

      {/* Bugün */}
      <div className="kart mt-4 p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
              Bugün
            </p>
            <h2 className="mt-0.5 text-base font-semibold">{bugunEtiket}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span>
              <strong className="font-semibold text-zinc-700">{bugunKisi}</strong> kişi
            </span>
            <span>
              <strong className="font-semibold text-zinc-700">{todayByShift.size}</strong> vardiya
            </span>
            <Link
              href="/bugun"
              className="font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
            >
              Tablet görünümü →
            </Link>
            <a
              href="#hafta-plani"
              className="font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
            >
              Planı düzenle
            </a>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {data.shiftTemplates.map((t) => {
            const list = todayByShift.get(t.id) ?? [];
            if (list.length === 0) return null;
            return (
              <span
                key={t.id}
                className={`inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg border px-2.5 py-1.5 text-xs ${
                  COLOR_CLASSES[t.color]?.chip ?? ""
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    COLOR_CLASSES[t.color]?.dot ?? ""
                  }`}
                />
                <strong className="font-semibold">{t.name}</strong>
                <span className="opacity-80">{shiftSaatMetni(t)}</span>
                <span className="opacity-80">{list.map((e) => e.name).join(", ")}</span>
              </span>
            );
          })}
          {todayByShift.size === 0 && (
            <p className="text-sm text-zinc-500">
              Bugün için atanmış vardiya yok. Aşağıdaki haftalık plandan ekleyebilirsin.
            </p>
          )}
        </div>
      </div>

      {/* Plan */}
      {weekEmpty ? (
        <div className="kart mt-4 border-dashed p-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-50">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-amber-700"
              aria-hidden="true"
            >
              <path d="M4 6h16v14H4z" />
              <path d="M4 10h16M8 3v4M16 3v4" />
            </svg>
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
        <div id="hafta-plani" className="kart mt-4 scroll-mt-20 overflow-hidden">
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
                Mesaj gönder
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
                  <a
                    href={`/api/plan/pdf?hafta=${weekISO}`}
                    download
                    className="block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
                  >
                    Planı PDF indir
                  </a>
                  <button
                    onClick={planPdfGonder}
                    disabled={postaBusy}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
                  >
                    {postaBusy ? "Gönderiliyor…" : "PDF'i e-postaya gönder"}
                  </button>
                  <button
                    onClick={exportCsv}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                  >
                    Excel (CSV) indir
                  </button>
                  <button
                    onClick={() => setShowPersonel(true)}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                  >
                    Personel listesi
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

          {/* Hızlı doldurma şeridi */}
          <div className="hidden flex-wrap items-center gap-1.5 border-b border-zinc-100 bg-zinc-50/60 px-4 py-2 sm:flex">
            <span className="mr-1 inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-3.5 w-3.5"
                aria-hidden
              >
                <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" strokeLinejoin="round" />
                <path d="m14.5 5.5 3 3" />
              </svg>
              Hızlı doldur
            </span>
            {data.shiftTemplates.map((t) => {
              const secili = firca === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFirca(secili ? null : t.id)}
                  aria-pressed={secili}
                  title={`${t.name} · ${shiftSaatMetni(t)}`}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px] transition-colors ${
                    COLOR_CLASSES[t.color]?.chip ?? ""
                  } ${
                    secili
                      ? "ring-2 ring-zinc-900 ring-offset-1"
                      : "hover:border-zinc-300"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      COLOR_CLASSES[t.color]?.dot ?? ""
                    }`}
                  />
                  {t.name}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setFirca(firca === "sil" ? null : "sil")}
              aria-pressed={firca === "sil"}
              className={`rounded-lg border px-2.5 py-1 text-[11.5px] transition-colors ${
                firca === "sil"
                  ? "border-red-300 bg-red-50 text-red-700 ring-2 ring-red-400 ring-offset-1"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
              }`}
            >
              Boşalt
            </button>
            {firca && (
              <button
                type="button"
                onClick={() => setFirca(null)}
                className="ml-1 text-[11px] text-zinc-500 underline underline-offset-2 hover:text-zinc-900"
              >
                Kapat (Esc)
              </button>
            )}
            <span className="ml-auto hidden text-[11px] text-zinc-500 lg:block">
              {firca
                ? "Hücrelere tıkla — her tık anında kaydedilir."
                : "Bir vardiya seç, sonra hücrelere tıklayarak doldur."}
            </span>
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
                  const satirTint =
                    acik || vurgu?.startsWith(`${emp.id}__`)
                      ? "satir-secili"
                      : uyariliIdler.has(emp.id)
                        ? "satir-uyari"
                        : "";
                  return (
                    <Fragment key={emp.id}>
                      <tr
                        id={`satir-${emp.id}`}
                        className={`border-t border-zinc-100 ${satirTint}`}
                      >
                        <td
                          className={`sticky left-0 z-10 px-4 py-2 ${
                            satirTint || "bg-white"
                          }`}
                        >
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
                            <td
                              key={iso}
                              className={`px-1 py-1.5 ${
                                vurgu === keyOf(emp.id, iso)
                                  ? "rounded-lg ring-2 ring-amber-400"
                                  : ""
                              }`}
                            >
                              {firca ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    changeAssignment(
                                      emp.id,
                                      iso,
                                      firca === "sil" ? "" : firca
                                    )
                                  }
                                  className={`w-full min-w-[84px] rounded-lg border px-1.5 py-1.5 text-[13px] transition-colors hover:ring-2 hover:ring-zinc-300 ${cls}`}
                                  aria-label={`${emp.name} ${formatShort(d)}: ${
                                    template?.name ?? "boş"
                                  } → ${
                                    firca === "sil"
                                      ? "boşalt"
                                      : templateById.get(firca)?.name ?? "vardiya"
                                  }`}
                                >
                                  {template?.name ?? "—"}
                                </button>
                              ) : (
                                <select
                                  value={shiftId}
                                  onChange={(e) => changeAssignment(emp.id, iso, e.target.value)}
                                  aria-label={`${emp.name} ${formatShort(d)} vardiyası`}
                                  className={`w-full min-w-[84px] cursor-pointer rounded-lg border px-1.5 py-1.5 text-[13px] outline-none transition-colors focus:ring-2 focus:ring-zinc-300 ${cls}`}
                                >
                                  <option value="">—</option>
                                  {data.shiftTemplates.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name}
                                    </option>
                                  ))}
                                </select>
                              )}
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
                            <span
                              className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle"
                              title={`${WEEKLY_LIMIT_HOURS} saati aştı`}
                            />
                          )}
                          {empOvertime(emp) > 0 && (
                            <span className="block text-[10px] text-amber-700">
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
                                {emp.phone ? <span>Tel: {emp.phone}</span> : null}
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
                                  <button
                                    onClick={() => linkIslem(emp, "yenile")}
                                    className="btn-ikincil btn-kucuk"
                                    title="Eski bağlantıyı geçersiz kılar, yenisini kopyalar"
                                  >
                                    Linki yenile
                                  </button>
                                  <button
                                    onClick={() => linkIslem(emp, "kapat")}
                                    className="btn-sessiz btn-kucuk"
                                    title="Personelin elindeki bağlantıyı kapatır"
                                  >
                                    Linki kapat
                                  </button>
                                  <button onClick={() => startEditEmp(emp)} className="btn-ikincil btn-kucuk">
                                    Düzenle
                                  </button>
                                  <button onClick={() => handleRemoveEmployee(emp)} className="btn-tehlike btn-kucuk">
                                    Çıkar
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
                      {sadeceUyarili
                        ? "Bu hafta süre uyarısı olan personel yok."
                        : "Aramanla eşleşen personel yok."}
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
                        c === 0 ? "text-red-600" : "text-zinc-600"
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
                      <button
                        onClick={() => linkIslem(emp, "yenile")}
                        className="btn-ikincil btn-kucuk"
                        title="Eski bağlantıyı geçersiz kılar, yenisini kopyalar"
                      >
                        Linki yenile
                      </button>
                      <button
                        onClick={() => linkIslem(emp, "kapat")}
                        className="btn-sessiz btn-kucuk"
                        title="Personelin elindeki bağlantıyı kapatır"
                      >
                        Kapat
                      </button>
                      <button onClick={() => handleRemoveEmployee(emp)} className="btn-tehlike btn-kucuk">
                        Çıkar
                      </button>
                    </div>
                  </div>
                </details>
              );
            })}
            {visibleEmployees.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-zinc-500">
                {sadeceUyarili
                  ? "Bu hafta süre uyarısı olan personel yok."
                  : "Aramanla eşleşen personel yok."}
              </p>
            )}
          </div>
        </div>
      )}

      {!weekEmpty && uyariSayisi === 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
          <span aria-hidden>✓</span> Bu hafta süre ve kapsam uyarısı yok.
        </p>
      )}

      {/* Uyarılar — yalnızca varsa */}
      {uyariSayisi > 0 && (
        <div id="uyarilar" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-amber-900">
              Uyarılar ({uyariSayisi})
            </h3>
            <p className="text-[11px] text-amber-800 opacity-80">
              Bir uyarıya tıkla → ilgili satıra git.
            </p>
          </div>
          {issues.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-sm">
              {issues.map((it, idx) => {
                const emp = empById.get(it.employeeId);
                const isErr = it.severity === "error";
                return (
                  <li key={`${it.employeeId}-${it.type}-${it.date}-${idx}`}>
                    <button
                      type="button"
                      onClick={() => uyariyaGit(it.employeeId, it.date)}
                      className="flex w-full gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-amber-100/70"
                    >
                      <span
                        aria-hidden
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          isErr ? "bg-red-500" : "bg-amber-500"
                        }`}
                      />
                      <span className="text-amber-900">
                        <strong>{emp?.name ?? "Bilinmeyen"}</strong>{" "}
                        <span className={isErr ? "text-red-700" : ""}>{it.message}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {coverageIssues.length > 0 && (
            <ul className="mt-2 space-y-0.5 border-t border-amber-200 pt-2 text-sm text-amber-900">
              {coverageIssues.map((c, i) => {
                const t = templateById.get(c.templateId);
                const day = new Date(c.date + "T00:00:00");
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() =>
                        document
                          .getElementById("hafta-plani")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }
                      className="w-full rounded-md px-1 py-1 text-left transition-colors hover:bg-amber-100/70"
                    >
                      <strong>{formatShort(day)}</strong> · {t?.name ?? "?"}: {c.have}/{c.need} kişi
                      <span className="text-amber-700"> (eksik {c.need - c.have})</span>
                    </button>
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
                  {t.name} · {shiftSaatMetni(t)}
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

      {/* Personel yönetimi */}
      <Modal
        acik={showPersonel}
        kapat={() => setShowPersonel(false)}
        baslik="Personel"
        genislik="max-w-lg"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-zinc-500">
            {data.employees.length} kişi · {data.business.name}
          </p>
          <button
            type="button"
            onClick={() => {
              setShowPersonel(false);
              setShowForm(true);
            }}
            className="btn-birincil btn-kucuk"
          >
            + Personel ekle
          </button>
        </div>

        {data.employees.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
            Henüz personel yok. Yukarıdaki düğmeyle ekleyebilirsin.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100">
            {data.employees.map((emp) => (
              <li key={emp.id} className="flex items-center gap-3 py-3">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    COLOR_CLASSES[emp.color]?.dot ?? "bg-zinc-400"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">{emp.name}</p>
                  <p className="truncate text-[11px] text-zinc-500">
                    {emp.role || "Görev yok"}
                    {emp.phone ? ` · ${emp.phone}` : ""} · izin{" "}
                    {emp.annualLeaveDays ?? 0} gün
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPersonel(false);
                    startEditEmp(emp);
                    window.setTimeout(
                      () =>
                        document
                          .getElementById(`satir-${emp.id}`)
                          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
                      150
                    );
                  }}
                  className="btn-ikincil btn-kucuk"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveEmployee(emp)}
                  className="btn-tehlike btn-kucuk"
                >
                  Çıkar
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
          Personel çıkarılınca o kişinin vardiyaları ve kişisel bağlantısı da silinir.
          Bu işlem geri alınamaz.
        </p>
      </Modal>

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

      {/* Personel içe aktarma (Excel / CSV) */}
      <Modal
        acik={showImport}
        kapat={() => setShowImport(false)}
        baslik="Excel / CSV'den personel aktar"
        genislik="max-w-lg"
      >
        <p className="text-sm text-zinc-600">
          Excel&apos;deki listeyi olduğu gibi kopyalayıp yapıştır ya da{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-[12px]">.csv</code>{" "}
          dosyası yükle. Sütun sırası: <strong>Ad; Görev; Telefon</strong>. Başlık
          satırı otomatik atlanır; görev ve telefon isteğe bağlıdır.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            ref={importDosya}
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
            onChange={handleImportDosya}
            className="sr-only"
            id="ice-aktar-dosya"
          />
          <button
            type="button"
            onClick={() => importDosya.current?.click()}
            className="btn-ikincil btn-kucuk"
          >
            Dosya seç
          </button>
          <span className="text-xs text-zinc-500">
            {importDosyaAdi || ".csv, .tsv, .txt · en fazla 200 kişi"}
          </span>
        </div>

        <textarea
          value={importText}
          onChange={(e) => {
            setImportText(e.target.value);
            setImportDosyaAdi("");
          }}
          rows={8}
          placeholder={"Ad Soyad\tGörev\tTelefon\nAyşe Yılmaz\tBarista\t0532 111 22 33\nMehmet Kaya\tGarson\t0533 222 33 44"}
          className="giris mt-3 font-mono text-[13px]"
          aria-label="Personel listesi"
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-emerald-700">
            {parseEmployeeText(importText).length > 0
              ? `✓ ${parseEmployeeText(importText).length} personel algılandı`
              : "Henüz personel algılanmadı"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowImport(false)}
              className="btn-ghost btn-kucuk"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={importBusy || parseEmployeeText(importText).length === 0}
              className="btn-birincil btn-kucuk"
            >
              {importBusy ? "Aktarılıyor…" : "İçe aktar"}
            </button>
          </div>
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
