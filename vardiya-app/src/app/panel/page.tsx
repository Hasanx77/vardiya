"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppData, Employee } from "@/lib/types";
import { assignmentKey } from "@/lib/types";
import { clearData, loadData, saveData, seedData, uid } from "@/lib/storage";
import {
  formatShort,
  formatWeekRange,
  getWeekDates,
  toISODate,
  DAY_SHORT_TR,
} from "@/lib/dates";
import { shiftHours, WEEKLY_LIMIT_HOURS } from "@/lib/shifts";
import { COLOR_CLASSES, nextColor } from "@/lib/colors";
import { buildScheduleText, buildWhatsAppLink } from "@/lib/whatsapp";

export default function PanelPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", role: "" });
  const [toast, setToast] = useState("");

  // İlk yüklemede veriyi al (tarayıcı tarafı)
  useEffect(() => {
    setData(loadData());
  }, []);

  // Her değişiklikte kaydet
  useEffect(() => {
    if (data) saveData(data);
  }, [data]);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const templateById = useMemo(() => {
    const map = new Map<string, AppData["shiftTemplates"][number]>();
    data?.shiftTemplates.forEach((t) => map.set(t.id, t));
    return map;
  }, [data]);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  }

  function setAssignment(empId: string, iso: string, shiftId: string) {
    setData((prev) => {
      if (!prev) return prev;
      const assignments = { ...prev.assignments };
      const key = assignmentKey(empId, iso);
      if (shiftId) assignments[key] = shiftId;
      else delete assignments[key];
      return { ...prev, assignments };
    });
  }

  function addEmployee() {
    const name = form.name.trim();
    if (!name) {
      flash("Personel adı gerekli.");
      return;
    }
    setData((prev) => {
      if (!prev) return prev;
      const emp: Employee = {
        id: uid("emp"),
        name,
        phone: form.phone.trim(),
        role: form.role.trim() || "Personel",
        color: nextColor(prev.employees.length),
      };
      return { ...prev, employees: [...prev.employees, emp] };
    });
    setForm({ name: "", phone: "", role: "" });
    setShowForm(false);
    flash("Personel eklendi ✅");
  }

  function removeEmployee(emp: Employee) {
    if (!window.confirm(`${emp.name} silinsin mi? Vardiyaları da silinir.`)) return;
    setData((prev) => {
      if (!prev) return prev;
      const assignments = { ...prev.assignments };
      Object.keys(assignments).forEach((k) => {
        if (k.startsWith(`${emp.id}__`)) delete assignments[k];
      });
      return {
        ...prev,
        employees: prev.employees.filter((e) => e.id !== emp.id),
        assignments,
      };
    });
    flash("Personel silindi.");
  }

  function weekTotal(emp: Employee): number {
    if (!data) return 0;
    let total = 0;
    for (const d of weekDates) {
      const shiftId = data.assignments[assignmentKey(emp.id, toISODate(d))];
      if (!shiftId) continue;
      const t = templateById.get(shiftId);
      if (t) total += shiftHours(t);
    }
    return total;
  }

  function sendWhatsApp(emp: Employee) {
    if (!data) return;
    if (!emp.phone.trim()) {
      flash("Bu personelin telefonu yok. Önce düzenle.");
      return;
    }
    const text = buildScheduleText(
      emp,
      weekDates,
      data.assignments,
      data.shiftTemplates,
      data.businessName
    );
    window.open(buildWhatsAppLink(emp.phone, text), "_blank");
  }

  async function copySchedule(emp: Employee) {
    if (!data) return;
    const text = buildScheduleText(
      emp,
      weekDates,
      data.assignments,
      data.shiftTemplates,
      data.businessName
    );
    try {
      await navigator.clipboard.writeText(text);
      flash("Program kopyalandı 📋");
    } catch {
      flash("Kopyalanamadı.");
    }
  }

  function resetDemo() {
    if (!window.confirm("Tüm veriler silinip örnek veri yüklensin mi?")) return;
    clearData();
    setData(seedData());
    flash("Örnek veri yüklendi.");
  }

  if (!data) {
    return (
      <main className="flex-1 grid place-items-center">
        <p className="text-zinc-500">Yükleniyor…</p>
      </main>
    );
  }

  const weekEmpty = data.employees.length === 0;

  return (
    <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
      {/* Üst bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label className="text-xs font-medium text-zinc-500">İşletme adı</label>
          <input
            value={data.businessName}
            onChange={(e) =>
              setData((prev) => (prev ? { ...prev, businessName: e.target.value } : prev))
            }
            className="mt-1 block w-full sm:w-64 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-lg font-semibold outline-none focus:border-zinc-900"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            + Personel Ekle
          </button>
          <button
            onClick={resetDemo}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
          >
            Örnek veriye dön
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
              onClick={addEmployee}
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
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${COLOR_CLASSES[emp.color].dot}`}
                        />
                        <div>
                          <div className="font-medium whitespace-nowrap">{emp.name}</div>
                          <div className="text-[11px] text-zinc-400">{emp.role}</div>
                        </div>
                      </div>
                    </td>
                    {weekDates.map((d) => {
                      const iso = toISODate(d);
                      const shiftId = data.assignments[assignmentKey(emp.id, iso)] ?? "";
                      const cls = shiftId
                        ? COLOR_CLASSES[templateById.get(shiftId)!.color].chip
                        : "bg-white text-zinc-400 border-dashed border-zinc-300";
                      return (
                        <td key={iso} className="px-1.5 py-2">
                          <select
                            value={shiftId}
                            onChange={(e) => setAssignment(emp.id, iso, e.target.value)}
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
                      <span
                        className={`font-semibold ${over ? "text-red-600" : "text-zinc-700"}`}
                      >
                        {total} sa
                      </span>
                      {over && (
                        <span className="ml-1 text-red-600" title={`${WEEKLY_LIMIT_HOURS} saati aştı`}>
                          ⚠️
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => sendWhatsApp(emp)}
                          title="WhatsApp'tan gönder"
                          className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          Gönder
                        </button>
                        <button
                          onClick={() => copySchedule(emp)}
                          title="Metni kopyala"
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                        >
                          Kopyala
                        </button>
                        <button
                          onClick={() => removeEmployee(emp)}
                          title="Sil"
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Şablon açıklaması */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-700">Vardiya Şablonları</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.shiftTemplates.map((t) => (
            <span
              key={t.id}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${COLOR_CLASSES[t.color].chip}`}
            >
              <span className={`h-2 w-2 rounded-full ${COLOR_CLASSES[t.color].dot}`} />
              {t.name} · {t.start}–{t.end} · {shiftHours(t)} sa
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Haftalık {WEEKLY_LIMIT_HOURS} saati aşan personel kırmızı ile işaretlenir (İş Kanunu
          haftalık çalışma süresi).
        </p>
      </div>

      {/* Bildirim */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
