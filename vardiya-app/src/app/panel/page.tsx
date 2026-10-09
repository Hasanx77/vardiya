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
} from "@/lib/api-client";
import { addDays, formatShort, formatWeekRange, getWeekDates, toISODate, DAY_SHORT_TR } from "@/lib/dates";
import { shiftHours, WEEKLY_LIMIT_HOURS } from "@/lib/shifts";
import { analyzeWeek, MIN_DAILY_REST_HOURS, OVERTIME_MULTIPLIER } from "@/lib/compliance";
import { COLOR_CLASSES } from "@/lib/colors";
import { buildScheduleText, buildWhatsAppLink } from "@/lib/whatsapp";
import TemplateManager from "@/components/TemplateManager";
import { getHoliday } from "@/lib/holidays";

function keyOf(employeeId: string, iso: string) {
  return `${employeeId}__${iso}`;
}

export default function PanelPage() {
  const [data, setData] = useState<StatePayload | null>(null);
  const [error, setError] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [empDraft, setEmpDraft] = useState({
    name: "",
    phone: "",
    role: "",
    hourlyWage: "",
    annualLeaveDays: "",
  });
  const [announcementDraft, setAnnouncementDraft] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", role: "", hourlyWage: "" });
  const [nameDraft, setNameDraft] = useState("");
  const [toast, setToast] = useState("");

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  }, []);

  const load = useCallback(async () => {
    try {
      const state = await fetchState();
      setData(state);
      setNameDraft(state.business.name);
      setError("");
    } catch {
      setError("Sunucuya ulaşılamadı. Dev server çalışıyor mu?");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
        hourlyWage: Number(form.hourlyWage) || 0,
      });
      setForm({ name: "", phone: "", role: "", hourlyWage: "" });
      setShowForm(false);
      await load();
      flash("Personel eklendi ✅");
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

  async function saveBusinessName() {
    if (!data) return;
    const name = nameDraft.trim();
    if (!name || name === data.business.name) return;
    try {
      await apiUpdateBusiness(name);
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
      flash("Geçen hafta kopyalandı ✅");
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
    const head = [
      "Personel",
      "Görev",
      ...weekDates.map((d) => formatShort(d)),
      "Toplam Saat",
      "Fazla Mesai (sa)",
      "Maliyet (TL)",
    ];
    const rows: string[][] = [head];
    for (const emp of data.employees) {
      const cells = weekDates.map((d) => {
        const sid = assignMap.get(keyOf(emp.id, toISODate(d)));
        const t = sid ? templateById.get(sid) : undefined;
        return t ? `${t.name} ${t.start}-${t.end}` : "";
      });
      rows.push([
        emp.name,
        emp.role,
        ...cells,
        String(weekTotal(emp)),
        String(empOvertime(emp)),
        String(Math.round(weekCost(emp))),
      ]);
    }
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vardiya-${toISODate(weekDates[0])}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    flash("CSV indirildi ⬇");
  }

  async function postAnnouncement() {
    const message = announcementDraft.trim();
    if (!message) return flash("Mesaj boş.");
    try {
      await apiCreateAnnouncement(message);
      setAnnouncementDraft("");
      await load();
      flash("Duyuru yayınlandı 📢");
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
    setEmpDraft({
      name: emp.name,
      phone: emp.phone,
      role: emp.role,
      hourlyWage: emp.hourlyWage ? String(emp.hourlyWage) : "",
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
        hourlyWage: Number(empDraft.hourlyWage) || 0,
        annualLeaveDays:
          empDraft.annualLeaveDays.trim() === ""
            ? 14
            : Math.max(0, Math.round(Number(empDraft.annualLeaveDays) || 0)),
      });
      setEditingEmpId(null);
      await load();
      flash("Personel güncellendi ✅");
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

  function weekCost(emp: Employee): number {
    return weekTotal(emp) * (emp.hourlyWage || 0);
  }

  /** Personelin haftalık fazla mesai saati (45 sa üstü) */
  function empOvertime(emp: Employee): number {
    return analysis?.perEmployee.get(emp.id)?.overtimeHours ?? 0;
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
      flash("Program kopyalandı 📋");
    } catch {
      flash("Kopyalanamadı.");
    }
  }

  async function copyStaffLink(emp: Employee) {
    const url = `${window.location.origin}/ekip/${emp.id}`;
    try {
      await navigator.clipboard.writeText(url);
      flash("Personel linki kopyalandı 🔗");
    } catch {
      flash("Kopyalanamadı.");
    }
  }

  if (error) {
    return (
      <main className="flex-1 grid place-items-center px-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p className="font-medium">{error}</p>
          <button
            onClick={load}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Tekrar dene
          </button>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex-1 grid place-items-center">
        <p className="text-zinc-500">Yükleniyor…</p>
      </main>
    );
  }

  const summaryHours = data.employees.reduce((s, e) => s + weekTotal(e), 0);
  const totalCost = data.employees.reduce((s, e) => s + weekTotal(e) * (e.hourlyWage || 0), 0);
  const totalOvertime = analysis?.totalOvertimeHours ?? 0;
  const overtimeCost = data.employees.reduce(
    (s, e) => s + empOvertime(e) * (e.hourlyWage || 0) * OVERTIME_MULTIPLIER,
    0
  );
  const issues = analysis?.issues ?? [];

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
    <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
      {/* Üst bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label className="text-xs font-medium text-zinc-500">İşletme adı</label>
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={saveBusinessName}
            className="mt-1 block w-full sm:w-64 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-lg font-semibold outline-none focus:border-zinc-900"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/ekip"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            Personel Görünümü
          </Link>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            + Personel Ekle
          </button>
        </div>
      </div>

      {/* 3 adım rehberi (sadelik) */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
          1 · Personel ekle
        </span>
        <span>→</span>
        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
          2 · Vardiyaları seç
        </span>
        <span>→</span>
        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
          3 · WhatsApp&apos;tan gönder
        </span>
      </div>

      {/* Personel ekleme formu */}
      {showForm && (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-5">
            <input
              placeholder="Ad Soyad *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
            <input
              placeholder="Telefon (05xx…)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
            <input
              placeholder="Görev (Barista, Garson…)"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
            <input
              placeholder="Saatlik ücret ₺"
              inputMode="decimal"
              value={form.hourlyWage}
              onChange={(e) => setForm({ ...form, hourlyWage: e.target.value })}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
            <button
              onClick={handleAddEmployee}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Hafta gezinme */}
      <div className="mt-6 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
        >
          ← Önceki
        </button>
        <div className="text-center">
          <div className="font-semibold">{formatWeekRange(weekDates)}</div>
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs text-zinc-500 hover:text-zinc-900 underline-offset-2 hover:underline"
          >
            Bu haftaya dön
          </button>
        </div>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
        >
          Sonraki →
        </button>
      </div>

      {/* Hızlı işlemler — en sık kullanılanlar görünür, gerisi "Diğer" altında */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={handleCopyPrev}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100"
        >
          ⧉ Geçen haftayı kopyala
        </button>
        <button
          onClick={() => setShowBulk(true)}
          className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
        >
          📤 Tümüne Gönder
        </button>
        <div className="relative">
          <button
            onClick={() => setShowMore((s) => !s)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100"
          >
            ⋯ Diğer
          </button>
          {showMore && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMore(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
                <Link
                  href="/yazdir"
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
                >
                  🖨 Yazdır / Çizelge
                </Link>
                <button
                  onClick={() => {
                    setShowMore(false);
                    exportCsv();
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                >
                  ⬇ Excel (CSV)
                </button>
                <button
                  onClick={() => {
                    setShowMore(false);
                    setShowSettings(true);
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                >
                  ⚙ Ayarlar
                </button>
                <button
                  onClick={() => {
                    setShowMore(false);
                    handleClearWeek();
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  🗑 Bu haftayı temizle
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bugün kim çalışıyor? */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-700">
          Bugün kim çalışıyor?{" "}
          <span className="font-normal text-zinc-400">({formatShort(new Date())})</span>
        </h3>
        <div className="mt-3 space-y-2">
          {data.shiftTemplates.map((t) => {
            const list = todayByShift.get(t.id) ?? [];
            if (list.length === 0) return null;
            return (
              <div key={t.id} className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 text-xs ${
                    COLOR_CLASSES[t.color]?.chip ?? ""
                  }`}
                >
                  {t.name} {t.start}–{t.end}
                </span>
                {list.map((e) => (
                  <span key={e.id} className="text-sm text-zinc-700">
                    {e.name}
                  </span>
                ))}
              </div>
            );
          })}
          {todayByShift.size === 0 && (
            <p className="text-sm text-zinc-400">Bugün için atanmış vardiya yok.</p>
          )}
        </div>
      </div>

      {/* Duyurular */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-700">📢 Duyurular</h3>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={announcementDraft}
            onChange={(e) => setAnnouncementDraft(e.target.value)}
            placeholder="Ekibe bir mesaj yaz… (ör. Cumartesi canlı müzik var)"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
          <button
            onClick={postAnnouncement}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Yayınla
          </button>
        </div>
        {data.announcements.length > 0 && (
          <ul className="mt-3 space-y-2">
            {data.announcements.slice(0, 5).map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm"
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

      {/* Ana ızgara */}
      {!weekEmpty && (
        <div className="mt-4 flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Personel ara…"
            className="w-56 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
          {search && (
            <span className="text-xs text-zinc-500">{visibleEmployees.length} sonuç</span>
          )}
        </div>
      )}

      {weekEmpty ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <div className="text-4xl">🚀</div>
          <h3 className="mt-3 text-lg font-semibold">Başlamaya hazırsın</h3>
          <p className="mt-1 text-sm text-zinc-600">
            1) Personelini ekle · 2) Haftalık vardiyayı doldur · 3) WhatsApp&apos;tan gönder.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              + İlk personeli ekle
            </button>
            <button
              onClick={() => handleReset("demo")}
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm text-zinc-600 hover:bg-zinc-100"
            >
              Örnek veriyle dene
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500">
                <th className="sticky left-0 z-10 bg-zinc-50 px-4 py-3 text-left font-medium">
                  Personel
                </th>
                {weekDates.map((d) => {
                  const iso = toISODate(d);
                  const holiday = getHoliday(iso);
                  return (
                    <th key={iso} className="px-2 py-3 font-medium whitespace-nowrap">
                      <span className={holiday ? "text-red-600" : ""}>
                        {DAY_SHORT_TR[(d.getDay() + 6) % 7]}
                      </span>
                      <span className="block text-[11px] text-zinc-400">{formatShort(d)}</span>
                      {holiday && (
                        <span
                          className="mt-0.5 block text-[10px] font-normal text-red-500"
                          title={holiday.name}
                        >
                          🎉 {holiday.halfDay ? "Arife" : "Tatil"}
                        </span>
                      )}
                      <button
                        onClick={() => editDayNote(iso)}
                        title={dayNoteMap.get(iso) ?? "Gün notu ekle"}
                        className="mt-0.5 block max-w-[110px] truncate text-[10px] font-normal text-sky-600 hover:underline"
                      >
                        {dayNoteMap.get(iso) ? `📝 ${dayNoteMap.get(iso)}` : "＋ not"}
                      </button>
                    </th>
                  );
                })}
                <th className="px-3 py-3 font-medium whitespace-nowrap">Toplam</th>
                <th className="px-3 py-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {visibleEmployees.map((emp) => {
                const total = weekTotal(emp);
                const over = total > WEEKLY_LIMIT_HOURS;
                const leaveLeft = emp.annualLeaveDays ?? 0;
                const stat = empMonthStats.get(emp.id) ?? { hours: 0, days: 0 };
                return (
                  <Fragment key={emp.id}>
                    <tr className="border-t border-zinc-100">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2">
                      {editingEmpId === emp.id ? (
                        <div className="flex w-40 flex-col gap-1">
                          <input
                            value={empDraft.name}
                            onChange={(e) => setEmpDraft({ ...empDraft, name: e.target.value })}
                            placeholder="Ad Soyad"
                            className="rounded border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-900"
                          />
                          <input
                            value={empDraft.role}
                            onChange={(e) => setEmpDraft({ ...empDraft, role: e.target.value })}
                            placeholder="Görev"
                            className="rounded border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-900"
                          />
                          <input
                            value={empDraft.phone}
                            onChange={(e) => setEmpDraft({ ...empDraft, phone: e.target.value })}
                            placeholder="Telefon"
                            className="rounded border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-900"
                          />
                          <input
                            value={empDraft.hourlyWage}
                            onChange={(e) => setEmpDraft({ ...empDraft, hourlyWage: e.target.value })}
                            placeholder="Saatlik ₺"
                            inputMode="decimal"
                            className="rounded border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-900"
                          />
                          <input
                            value={empDraft.annualLeaveDays}
                            onChange={(e) =>
                              setEmpDraft({ ...empDraft, annualLeaveDays: e.target.value })
                            }
                            placeholder="Yıllık izin gün"
                            inputMode="numeric"
                            className="rounded border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-900"
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setExpandedEmpId((v) => (v === emp.id ? null : emp.id))}
                          className="flex items-center gap-2 text-left"
                          title="Detayları göster/gizle"
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              COLOR_CLASSES[emp.color]?.dot ?? "bg-zinc-400"
                            }`}
                          />
                          <div>
                            <div className="font-medium whitespace-nowrap">{emp.name}</div>
                            <div className="text-[11px] text-zinc-400">
                              {emp.role} · İzin {leaveLeft} gün
                            </div>
                          </div>
                        </button>
                      )}
                    </td>
                    {weekDates.map((d) => {
                      const iso = toISODate(d);
                      const shiftId = assignMap.get(keyOf(emp.id, iso)) ?? "";
                      const template = shiftId ? templateById.get(shiftId) : undefined;
                      const cls = template
                        ? COLOR_CLASSES[template.color]?.chip ?? ""
                        : "bg-white text-zinc-400 border-dashed border-zinc-300";
                      return (
                        <td key={iso} className="px-1.5 py-2">
                          <select
                            value={shiftId}
                            onChange={(e) => changeAssignment(emp.id, iso, e.target.value)}
                            className={`w-full min-w-[92px] cursor-pointer rounded-lg border px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-zinc-300 ${cls}`}
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
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`font-semibold ${over ? "text-red-600" : "text-zinc-700"}`}>
                        {total} sa
                      </span>
                      {over && (
                        <span className="ml-1 text-red-600" title={`${WEEKLY_LIMIT_HOURS} saati aştı`}>
                          ⚠️
                        </span>
                      )}
                      {empOvertime(emp) > 0 && (
                        <span className="block text-[11px] text-amber-600">
                          +{empOvertime(emp)} sa fazla mesai
                        </span>
                      )}
                      {emp.hourlyWage > 0 && (
                        <span className="block text-[11px] text-zinc-500">
                          ≈ {weekCost(emp).toLocaleString("tr-TR")} ₺
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {editingEmpId === emp.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={saveEmp}
                            className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-700"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={() => setEditingEmpId(null)}
                            className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                          >
                            Vazgeç
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => sendWhatsApp(emp)}
                            className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                          >
                            Gönder
                          </button>
                          <button
                            onClick={() => copySchedule(emp)}
                            className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                          >
                            Kopyala
                          </button>
                          <button
                            onClick={() => copyStaffLink(emp)}
                            className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                          >
                            Link
                          </button>
                          <button
                            onClick={() => startEditEmp(emp)}
                            className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleRemoveEmployee(emp)}
                            className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            Sil
                          </button>
                        </div>
                      )}
                    </td>
                    </tr>
                    {expandedEmpId === emp.id && (
                      <tr className="bg-zinc-50">
                        <td
                          colSpan={weekDates.length + 3}
                          className="px-4 py-3 text-sm text-zinc-600"
                        >
                          {emp.phone ? `📞 ${emp.phone} · ` : ""}
                          Bu ay: <strong>{Math.round(stat.hours * 10) / 10} sa</strong> ·{" "}
                          {stat.days} gün
                          {emp.hourlyWage > 0
                            ? ` · ≈ ${Math.round(stat.hours * emp.hourlyWage).toLocaleString(
                                "tr-TR"
                              )} ₺`
                            : ""}
                          {" · "}Kalan izin: <strong>{leaveLeft} gün</strong>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
                <td className="sticky left-0 z-10 bg-zinc-50 px-4 py-2 font-medium">
                  Günlük kapsam
                </td>
                {dayCounts.map((c, i) => (
                  <td
                    key={i}
                    className={`px-2 py-2 text-center font-medium ${
                      c === 0 ? "text-red-500" : "text-zinc-600"
                    }`}
                  >
                    {c} kişi
                  </td>
                ))}
                <td colSpan={2} className="px-3 py-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Haftalık özet */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Bu hafta toplam saat</div>
          <div className="mt-1 text-2xl font-semibold">{summaryHours} sa</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Tahmini işçilik maliyeti</div>
          <div className="mt-1 text-2xl font-semibold">
            {totalCost > 0 ? `≈ ${totalCost.toLocaleString("tr-TR")} ₺` : "—"}
          </div>
        </div>
        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            totalOvertime > 0 ? "border-amber-200 bg-amber-50" : "border-zinc-200 bg-white"
          }`}
        >
          <div className="text-xs text-zinc-500">Fazla mesai ({WEEKLY_LIMIT_HOURS} sa üstü)</div>
          <div className={`mt-1 text-2xl font-semibold ${totalOvertime > 0 ? "text-amber-700" : ""}`}>
            {totalOvertime > 0 ? `${totalOvertime} sa` : "—"}
          </div>
          {overtimeCost > 0 && (
            <div className="text-[11px] text-amber-600">
              ≈ {Math.round(overtimeCost).toLocaleString("tr-TR")} ₺ ({OVERTIME_MULTIPLIER}x)
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-zinc-500">Personel sayısı</div>
          <div className="mt-1 text-2xl font-semibold">{data.employees.length}</div>
        </div>
      </div>

      {/* Mevzuat uyarıları */}
      {data.employees.length > 0 && (
        <div
          className={`mt-4 rounded-2xl border p-4 ${
            issues.length > 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <h3
            className={`text-sm font-semibold ${
              issues.length > 0 ? "text-amber-900" : "text-emerald-800"
            }`}
          >
            ⚖️ Mevzuat Uyarıları {issues.length > 0 ? `(${issues.length})` : ""}
          </h3>
          {issues.length === 0 ? (
            <p className="mt-2 text-sm text-emerald-800">
              Bu hafta için çakışma veya mevzuat ihlali yok. (Haftalık {WEEKLY_LIMIT_HOURS} saat ·
              iki vardiya arası en az {MIN_DAILY_REST_HOURS} saat dinlenme)
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {issues.map((it, idx) => {
                const emp = empById.get(it.employeeId);
                const isErr = it.severity === "error";
                return (
                  <li
                    key={`${it.employeeId}-${it.type}-${it.date}-${idx}`}
                    className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                  >
                    <span aria-hidden>{isErr ? "⛔" : "⚠️"}</span>
                    <span>
                      <strong>{emp?.name ?? "Bilinmeyen"}</strong>{" "}
                      <span className={isErr ? "text-red-700" : "text-amber-700"}>
                        {it.message}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Kapsam uyarıları */}
      {coverageIssues.length > 0 && (
        <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
          <h3 className="font-semibold">🎯 Kapsam uyarıları ({coverageIssues.length})</h3>
          <ul className="mt-2 space-y-1">
            {coverageIssues.map((c, i) => {
              const t = templateById.get(c.templateId);
              const day = new Date(c.date + "T00:00:00");
              return (
                <li key={i}>
                  {formatShort(day)} · {t?.name ?? "?"}: {c.have}/{c.need} kişi (eksik{" "}
                  {c.need - c.have})
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Şablonlar */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-700">Vardiya Şablonları</h3>
          <button
            onClick={() => setShowTemplates((s) => !s)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100"
          >
            {showTemplates ? "Kapat" : "Şablonları Yönet"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.shiftTemplates.map((t) => (
            <span
              key={t.id}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${
                COLOR_CLASSES[t.color]?.chip ?? ""
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${COLOR_CLASSES[t.color]?.dot ?? ""}`} />
              {t.name} · {t.start}–{t.end} · {shiftHours(t)} sa
            </span>
          ))}
        </div>
        {showTemplates && (
          <div className="mt-4">
            <TemplateManager templates={data.shiftTemplates} onChanged={load} />
          </div>
        )}
        <p className="mt-3 text-xs text-zinc-500">
          Denetimler: haftalık {WEEKLY_LIMIT_HOURS} saat sınırı, iki vardiya arası en az{" "}
          {MIN_DAILY_REST_HOURS} saat dinlenme ve aynı gün çift vardiya (İş Kanunu 4857). İhlaller
          yukarıdaki &quot;Mevzuat Uyarıları&quot; kartında listelenir.
        </p>
      </div>

      {/* Ayarlar modali */}
      {showSettings && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold">Ayarlar</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Veri işlemleri. İşletme adını üstteki alandan değiştirebilirsin.
            </p>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => handleReset("demo")}
                className="w-full rounded-lg border border-zinc-300 py-2.5 text-sm hover:bg-zinc-100"
              >
                🔄 Örnek veriyi (demo) yükle
              </button>
              <button
                onClick={() => handleReset("empty")}
                className="w-full rounded-lg border border-red-300 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                🗑 Boş başla (tüm personeli sil)
              </button>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="mt-4 w-full rounded-lg border border-zinc-300 py-2 text-sm hover:bg-zinc-100"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Toplu gönderim modali */}
      {showBulk && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4"
          onClick={() => setShowBulk(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold">Tüm personele gönder</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Her personele kendi programı hazırlanır. Sırayla açıp gönder.
            </p>
            <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
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
                    className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  >
                    <span>{emp.name}</span>
                    {emp.phone ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
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
            <button
              onClick={() => setShowBulk(false)}
              className="mt-4 w-full rounded-lg border border-zinc-300 py-2 text-sm hover:bg-zinc-100"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
