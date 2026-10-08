"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { StatePayload } from "@/lib/types";
import {
  addEmployeesBulk,
  fetchState,
  resetData,
  updateBusiness,
} from "@/lib/api-client";
import { DEFAULT_SHIFTS } from "@/lib/shifts";

type ParsedEmployee = { name: string; role: string; phone: string };

/** "Ad; Görev; Telefon" satırlarını personel listesine çevirir */
function parseEmployees(text: string): ParsedEmployee[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[;\t]/).map((p) => p.trim());
      return { name: parts[0] ?? "", role: parts[1] ?? "", phone: parts[2] ?? "" };
    })
    .filter((e) => e.name.length > 0);
}

export default function BaslaPage() {
  const router = useRouter();
  const [data, setData] = useState<StatePayload | null>(null);
  const [name, setName] = useState("");
  const [bulk, setBulk] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      const s = await fetchState();
      setData(s);
      setName((n) => n || s.business.name);
    } catch {
      setMsg("Sunucuya ulaşılamadı.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parsed = useMemo(() => parseEmployees(bulk), [bulk]);

  async function handleReset() {
    if (!window.confirm("Tüm personel, vardiya ve talepler silinecek. Sıfırdan başlanacak. Devam?"))
      return;
    setBusy(true);
    try {
      await resetData("empty");
      await load();
      setMsg("Sıfırlandı. Şimdi personelini ekleyebilirsin.");
    } catch {
      setMsg("Sıfırlama başarısız.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFinish() {
    const cleanName = name.trim();
    if (!cleanName) {
      setMsg("İşletme adı gerekli.");
      return;
    }
    setBusy(true);
    try {
      if (!data || cleanName !== data.business.name) {
        await updateBusiness(cleanName);
      }
      if (parsed.length > 0) {
        await addEmployeesBulk(parsed);
      }
      router.push("/panel");
    } catch {
      setMsg("Kurulum tamamlanamadı, tekrar dene.");
      setBusy(false);
    }
  }

  const existing = data?.employees.length ?? 0;

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-10">
      <span className="inline-block rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
        Kurulum
      </span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">90 saniyede kur</h1>
      <p className="mt-1 text-zinc-600">
        İşletme adını yaz, personelini yapıştır — hazırsın. Vardiya şablonları
        (Sabah / Akşam / Tam Gün) zaten tanımlı.
      </p>

      {/* 1) İşletme adı */}
      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-zinc-700">
          <span className="text-zinc-400">1.</span> İşletme adı
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn. Kahve Durağı"
          className="mt-2 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-lg outline-none focus:border-zinc-900"
        />
      </section>

      {/* 2) Personel */}
      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-700">
            <span className="text-zinc-400">2.</span> Personel
          </label>
          {existing > 0 && (
            <span className="text-xs text-zinc-500">Şu an {existing} personel var</span>
          )}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Her satıra bir personel: <code className="rounded bg-zinc-100 px-1">Ad; Görev; Telefon</code>
          <br />
          Örnek: <code className="rounded bg-zinc-100 px-1">Ayşe Yılmaz; Barista; 0532 111 22 33</code>
        </p>
        <textarea
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          rows={6}
          placeholder={"Ayşe Yılmaz; Barista; 0532 111 22 33\nMehmet Kaya; Garson; 0533 222 33 44\nZeynep Demir; Şef"}
          className="mt-3 block w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm outline-none focus:border-zinc-900"
        />
        {parsed.length > 0 && (
          <p className="mt-2 text-xs text-emerald-700">✓ {parsed.length} personel algılandı</p>
        )}
      </section>

      {/* 3) Bitir */}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          onClick={handleFinish}
          disabled={busy}
          className="rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          3. Kur ve başla →
        </button>
        <button
          onClick={handleReset}
          disabled={busy}
          className="rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Demo verisini temizle (sıfırdan başla)
        </button>
      </div>

      {msg && <p className="mt-4 text-sm text-zinc-600">{msg}</p>}

      {/* Hazır şablonlar */}
      <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 p-4 text-xs text-zinc-500">
        Hazır vardiya şablonları:{" "}
        {DEFAULT_SHIFTS.map((s) => `${s.name} ${s.start}–${s.end}`).join(" · ")}
      </div>
    </main>
  );
}
