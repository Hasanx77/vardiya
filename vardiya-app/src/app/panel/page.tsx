"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Employee, StatePayload } from "@/lib/types";
import {
  addEmployee as apiAddEmployee,
  clearWeek as apiClearWeek,
  copyWeek as apiCopyWeek,
  deleteEmployee as apiDeleteEmployee,
  fetchState,
  setAssignment as apiSetAssignment,
  updateBusiness as apiUpdateBusiness,
  updateEmployee as apiUpdateEmployee,
  updateRequest as apiUpdateRequest,
} from "@/lib/api-client";
import { addDays, formatShort, formatWeekRange, getWeekDates, toISODate, DAY_SHORT_TR } from "@/lib/dates";
import { shiftHours, WEEKLY_LIMIT_HOURS } from "@/lib/shifts";
import { COLOR_CLASSES } from "@/lib/colors";
import { buildScheduleText, buildWhatsAppLink } from "@/lib/whatsapp";
import TemplateManager from "@/components/TemplateManager";

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
  const [empDraft, setEmpDraft] = useState({ name: "", phone: "", role: "" });
  const [showBulk, setShowBulk] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", role: "" });
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
      await apiAddEmployee({ name, phone: form.phone.trim(), role: form.role.trim() });
      setForm({ name: "", phone: "", role: "" });
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

  async function handleRequest(id: string, status: string) {
    try {
      await apiUpdateRequest(id, status);
      await load();
      flash(status === "approved" ? "Onaylandı ✅" : "Reddedildi.");
    } catch {
      flash("İşlem başarısız.");
    }
  }

  function startEditEmp(emp: Employee) {
    setEditingEmpId(emp.id);
    setEmpDraft({ name: emp.name, phone: emp.phone, role: emp.role });
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

  const pending = data.requests.filter((r) => r.status === "pending");
  const resolved = data.requests.filter((r) => r.status !== "pending");
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

      {/* Personel ekleme formu */}
      {showForm && (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-4">
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
            <button
              onClick={handleAddEmployee}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Bekleyen talepler */}
      {pending.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900">
            ⏳ Bekleyen talepler ({pending.length})
          </h3>
          <ul className="mt-3 space-y-2">
            {pending.map((r) => {
              const emp = empById.get(r.employeeId);
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <span>
                    <strong>{emp?.name ?? "Bilinmeyen"}</strong> ·{" "}
                    {r.type === "degisim" ? "Vardiya değişimi" : "İzin"} ·{" "}
                    {r.date}
                    {r.note ? ` · "${r.note}"` : ""}
                  </span>
                  <span className="flex gap-2">
                    <button
                      onClick={() => handleRequest(r.id, "approved")}
                      className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => handleRequest(r.id, "rejected")}
                      className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Reddet
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Talep geçmişi */}
      {resolved.length > 0 && (
        <details className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-700">
            Talep geçmişi ({resolved.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {resolved.map((r) => {
              const emp = empById.get(r.employeeId);
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                >
                  <span>
                    <strong>{emp?.name ?? "?"}</strong> ·{" "}
                    {r.type === "degisim" ? "Değişim" : "İzin"} · {r.date}
                  </span>
                  <span className={r.status === "approved" ? "text-emerald-700" : "text-red-600"}>
                    {r.status === "approved" ? "Onaylandı" : "Reddedildi"}
                  </span>
                </li>
              );
            })}
          </ul>
        </details>
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

      {/* Hızlı işlemler */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={handleCopyPrev}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100"
        >
          ⧉ Geçen haftayı kopyala
        </button>
        <button
          onClick={handleClearWeek}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
        >
          🗑 Bu haftayı temizle
        </button>
        <Link
          href="/yazdir"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100"
        >
          🖨 Yazdır / Çizelge
        </Link>
        <button
          onClick={() => setShowBulk(true)}
          className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-100"
        >
          📤 Tümüne Gönder
        </button>
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

      {/* Ana ızgara */}
      {weekEmpty ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-zinc-600">
            Henüz personel yok. Yukarıdaki <strong>+ Personel Ekle</strong> ile başla.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500">
                <th className="sticky left-0 z-10 bg-zinc-50 px-4 py-3 text-left font-medium">
                  Personel
                </th>
                {weekDates.map((d) => (
                  <th key={toISODate(d)} className="px-2 py-3 font-medium whitespace-nowrap">
                    {DAY_SHORT_TR[(d.getDay() + 6) % 7]}
                    <span className="block text-[11px] text-zinc-400">{formatShort(d)}</span>
                  </th>
                ))}
                <th className="px-3 py-3 font-medium whitespace-nowrap">Toplam</th>
                <th className="px-3 py-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {data.employees.map((emp) => {
                const total = weekTotal(emp);
                const over = total > WEEKLY_LIMIT_HOURS;
                return (
                  <tr key={emp.id} className="border-t border-zinc-100">
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
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              COLOR_CLASSES[emp.color]?.dot ?? "bg-zinc-400"
                            }`}
                          />
                          <div>
                            <div className="font-medium whitespace-nowrap">{emp.name}</div>
                            <div className="text-[11px] text-zinc-400">{emp.role}</div>
                          </div>
                        </div>
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
                );
              })}
            </tbody>
          </table>
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
          Haftalık {WEEKLY_LIMIT_HOURS} saati aşan personel kırmızı ile işaretlenir (İş Kanunu
          haftalık çalışma süresi).
        </p>
      </div>

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
