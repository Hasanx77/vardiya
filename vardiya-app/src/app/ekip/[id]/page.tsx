"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { StatePayload } from "@/lib/types";
import { claimOpenShift, createRequest, fetchState, setAvailability } from "@/lib/api-client";
import { formatWeekRange, getWeekDates, toISODate, DAY_NAMES_TR, formatShort } from "@/lib/dates";
import { shiftHours, WEEKLY_LIMIT_HOURS } from "@/lib/shifts";
import { COLOR_CLASSES } from "@/lib/colors";

export default function EmployeePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [data, setData] = useState<StatePayload | null>(null);
  const [error, setError] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [reqForm, setReqForm] = useState({
    date: "",
    type: "izin",
    note: "",
    targetEmployeeId: "",
  });
  const [sent, setSent] = useState("");
  const [availForm, setAvailForm] = useState({ date: "", note: "" });

  useEffect(() => {
    fetchState()
      .then(setData)
      .catch(() => setError("Sunucuya ulaşılamadı."));
  }, []);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const employee = data?.employees.find((e) => e.id === id);
  const templateById = useMemo(() => {
    const m = new Map<string, StatePayload["shiftTemplates"][number]>();
    data?.shiftTemplates.forEach((t) => m.set(t.id, t));
    return m;
  }, [data]);

  const assignMap = useMemo(() => {
    const m = new Map<string, string>();
    data?.assignments.forEach((a) => m.set(`${a.employeeId}__${a.date}`, a.shiftTemplateId));
    return m;
  }, [data]);

  if (error) {
    return (
      <main className="flex-1 grid place-items-center px-4">
        <p className="text-red-600">{error}</p>
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
  if (!employee) {
    return (
      <main className="flex-1 grid place-items-center px-4">
        <div className="text-center">
          <p className="text-zinc-600">Personel bulunamadı.</p>
          <Link href="/ekip" className="mt-2 inline-block text-sm text-zinc-500 underline">
            ← Ekibe dön
          </Link>
        </div>
      </main>
    );
  }

  const total = weekDates.reduce((sum, d) => {
    const shiftId = assignMap.get(`${employee.id}__${toISODate(d)}`);
    const t = shiftId ? templateById.get(shiftId) : undefined;
    return sum + (t ? shiftHours(t) : 0);
  }, 0);
  // Haftalık 45 saat üstü fazla mesai (personel kendi görünümünde de uyarılır)
  const overtime = Math.round(Math.max(0, total - WEEKLY_LIMIT_HOURS) * 10) / 10;

  async function submitRequest() {
    if (!reqForm.date) {
      setSent("Lütfen bir tarih seç.");
      return;
    }
    if (reqForm.type === "degisim" && !reqForm.targetEmployeeId) {
      setSent("Vardiya değişimi için bir arkadaş seç.");
      return;
    }
    try {
      await createRequest({
        employeeId: employee!.id,
        date: reqForm.date,
        type: reqForm.type,
        note: reqForm.note,
        targetEmployeeId: reqForm.type === "degisim" ? reqForm.targetEmployeeId : undefined,
      });
      setReqForm({ date: "", type: "izin", note: "", targetEmployeeId: "" });
      setSent("Talebiniz gönderildi ✅ İşletme onaylayınca bilgilendirileceksiniz.");
    } catch {
      setSent("Talep gönderilemedi, tekrar deneyin.");
    }
  }

  const leaveUsed = data.requests.filter(
    (r) => r.employeeId === employee.id && r.status === "approved" && r.type === "izin"
  ).length;
  const leaveLeft = Math.max(0, (employee.annualLeaveDays ?? 0) - leaveUsed);

  const myAvail = data.availabilities.filter((a) => a.employeeId === employee.id);

  async function addAvailability() {
    if (!availForm.date) {
      setSent("Müsait olmadığın gün için bir tarih seç.");
      return;
    }
    try {
      await setAvailability({
        employeeId: employee!.id,
        date: availForm.date,
        note: availForm.note,
      });
      setAvailForm({ date: "", note: "" });
      setData(await fetchState());
      setSent("Müsait olmadığın gün kaydedildi ✅");
    } catch {
      setSent("Kaydedilemedi, tekrar dene.");
    }
  }

  async function removeAvailability(date: string) {
    try {
      await setAvailability({ employeeId: employee!.id, date, remove: true });
      setData(await fetchState());
    } catch {
      /* yoksay */
    }
  }

  async function claimShift(id: string) {
    if (!window.confirm("Bu açık vardiyayı sahiplenmek istiyor musun?")) return;
    try {
      await claimOpenShift(id, employee!.id);
      setData(await fetchState());
      setSent("Vardiyayı sahiplendin ✅");
    } catch {
      setSent("Sahiplenilemedi, tekrar dene.");
    }
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-10">
      <Link href="/ekip" className="text-sm text-zinc-500 hover:underline">
        ← Ekibe dön
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${COLOR_CLASSES[employee.color]?.dot ?? ""}`} />
        <div>
          <h1 className="text-2xl font-semibold">{employee.name}</h1>
          <p className="text-sm text-zinc-500">
            {employee.role} · {data.business.name}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm text-zinc-500">
        🌴 Kalan izin: <strong className="text-zinc-800">{leaveLeft} gün</strong>{" "}
        <span className="text-zinc-400">
          ({leaveUsed}/{employee.annualLeaveDays} kullanıldı)
        </span>
      </p>

      <a
        href={`/api/calendar/${employee.id}`}
        className="mt-3 inline-block rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
      >
        📅 Telefon takvimine ekle (.ics)
      </a>

      {data.announcements.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold">📢 Duyurular</div>
          <ul className="mt-2 space-y-1">
            {data.announcements.slice(0, 3).map((a) => (
              <li key={a.id}>• {a.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Hafta gezinme */}
      <div className="mt-6 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
        >
          ←
        </button>
        <div className="text-center">
          <div className="font-semibold">{formatWeekRange(weekDates)}</div>
          <div className="text-xs text-zinc-500">
            Toplam {total} saat
            {overtime > 0 && (
              <span className="text-amber-600">
                {" "}
                · ⚠️ {overtime} sa fazla mesai ({WEEKLY_LIMIT_HOURS} sa üstü)
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
        >
          →
        </button>
      </div>

      {/* Günlük program */}
      <ul className="mt-4 space-y-2">
        {weekDates.map((d) => {
          const shiftId = assignMap.get(`${employee.id}__${toISODate(d)}`);
          const t = shiftId ? templateById.get(shiftId) : undefined;
          const dayName = DAY_NAMES_TR[(d.getDay() + 6) % 7];
          return (
            <li
              key={toISODate(d)}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3"
            >
              <span className="text-sm text-zinc-600">
                {dayName} <span className="text-zinc-400">{formatShort(d)}</span>
              </span>
              {t ? (
                <span
                  className={`rounded-lg border px-3 py-1 text-xs ${
                    COLOR_CLASSES[t.color]?.chip ?? ""
                  }`}
                >
                  {t.name} · {t.start}–{t.end}
                </span>
              ) : (
                <span className="text-xs text-zinc-400">İzin / boş</span>
              )}
            </li>
          );
        })}
      </ul>

      {/* İzin / değişim talebi */}
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">İzin / Vardiya Değişimi Talebi</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-zinc-500">Tarih</span>
            <input
              type="date"
              value={reqForm.date}
              onChange={(e) => setReqForm({ ...reqForm, date: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            />
          </label>
          <label className="text-sm">
            <span className="text-zinc-500">Tür</span>
            <select
              value={reqForm.type}
              onChange={(e) => setReqForm({ ...reqForm, type: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            >
              <option value="izin">İzin</option>
              <option value="degisim">Vardiya değişimi</option>
              <option value="birak">Vardiyayı bırak</option>
            </select>
          </label>
        </div>
        {reqForm.type === "degisim" && (
          <label className="mt-3 block text-sm">
            <span className="text-zinc-500">Kiminle değiştirmek istiyorsun?</span>
            <select
              value={reqForm.targetEmployeeId}
              onChange={(e) => setReqForm({ ...reqForm, targetEmployeeId: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            >
              <option value="">Seç…</option>
              {data.employees
                .filter((e) => e.id !== employee.id)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
            </select>
          </label>
        )}
        <label className="mt-3 block text-sm">
          <span className="text-zinc-500">Not (opsiyonel)</span>
          <textarea
            value={reqForm.note}
            onChange={(e) => setReqForm({ ...reqForm, note: e.target.value })}
            rows={2}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            placeholder="Örn. 14:00'ten sonra müsaitim"
          />
        </label>
        <button
          onClick={submitRequest}
          className="mt-4 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Talebi Gönder
        </button>
        {sent && <p className="mt-3 text-sm text-emerald-700">{sent}</p>}
      </div>

      {/* Müsait olmadığım günler */}
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Müsait olmadığım günler</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Çalışamayacağın günleri işaretle; işletme planlarken görür.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            type="date"
            value={availForm.date}
            onChange={(e) => setAvailForm({ ...availForm, date: e.target.value })}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
          <input
            placeholder="Not (opsiyonel)"
            value={availForm.note}
            onChange={(e) => setAvailForm({ ...availForm, note: e.target.value })}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </div>
        <button
          onClick={addAvailability}
          className="mt-3 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Müsait değilim
        </button>
        {myAvail.length > 0 && (
          <ul className="mt-3 space-y-1">
            {myAvail.map((a) => (
              <li
                key={a.date}
                className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm"
              >
                <span>
                  {a.date}
                  {a.note ? ` · ${a.note}` : ""}
                </span>
                <button
                  onClick={() => removeAvailability(a.date)}
                  className="text-xs text-zinc-400 hover:text-red-600"
                >
                  Kaldır
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Açık vardiyalar */}
      {data.openShifts.length > 0 && (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="font-semibold text-emerald-900">🔓 Açık vardiyalar</h2>
          <p className="mt-1 text-xs text-emerald-800">
            Sahiplenmek istediğin vardiyaya bas; onay beklemeden vardiya senin olur.
          </p>
          <ul className="mt-3 space-y-2">
            {data.openShifts.map((o) => {
              const t = templateById.get(o.shiftTemplateId);
              const day = new Date(o.date + "T00:00:00");
              return (
                <li
                  key={o.id}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                >
                  <span>
                    {formatShort(day)} · {t?.name ?? "?"} ({t?.start}–{t?.end})
                    {o.note ? ` · ${o.note}` : ""}
                  </span>
                  <button
                    onClick={() => claimShift(o.id)}
                    className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Sahiplen
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </main>
  );
}
