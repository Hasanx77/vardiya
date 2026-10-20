"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { StatePayload } from "@/lib/types";
import {
  addEmployeesBulk,
  fetchState,
  resetData,
  updateBusiness,
} from "@/lib/api-client";
import { DEFAULT_SHIFTS, shiftSaatMetni } from "@/lib/shifts";
import { dosyaKabulEdilir, parseEmployeeText } from "@/lib/personel-aktarim";

export default function BaslaClient({ initialData }: { initialData: StatePayload }) {
  const router = useRouter();
  const [data, setData] = useState<StatePayload>(initialData);
  const [name, setName] = useState(initialData.business.name);
  const [bulk, setBulk] = useState("");
  const [dosyaAdi, setDosyaAdi] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const dosyaGirdisi = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const s = await fetchState();
      setData(s);
      setName((n) => n || s.business.name);
    } catch {
      setMsg("Sunucuya ulaşılamadı.");
    }
  }

  const parsed = useMemo(() => parseEmployeeText(bulk), [bulk]);

  async function handleDosya(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    if (!dosya) return;

    if (!dosyaKabulEdilir(dosya.name)) {
      setMsg("Yalnızca .csv, .tsv veya .txt dosyası yükleyebilirsin. Excel'de 'Farklı kaydet → CSV' seç.");
      return;
    }

    try {
      const metin = await dosya.text();
      setBulk(metin);
      setDosyaAdi(dosya.name);
      setMsg("");
    } catch {
      setMsg("Dosya okunamadı. Excel'den kopyalayıp yapıştırmayı da deneyebilirsin.");
    } finally {
      // Aynı dosyayı yeniden seçebilmek için girdiyi sıfırla.
      if (dosyaGirdisi.current) dosyaGirdisi.current.value = "";
    }
  }

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
        await updateBusiness({ name: cleanName });
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
  const sablonlar = data?.shiftTemplates.length ? data.shiftTemplates : DEFAULT_SHIFTS;

  return (
    <main className="sayfa max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
        Kurulum
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">90 saniyede kur</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        İşletme adını yaz, personelini yapıştır — hazırsın. Vardiya şablonları
        (Sabah / Akşam / Tam Gün / Ara) zaten tanımlı.
      </p>

      <div className="kart mt-6 divide-y divide-zinc-100">
        {/* 1) İşletme adı */}
        <section className="p-5">
          <label htmlFor="isletme-ad" className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white">
              1
            </span>
            İşletme adı
          </label>
          <input
            id="isletme-ad"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn. Kahve Durağı"
            className="giris mt-2 text-base"
          />
        </section>

        {/* 2) Personel */}
        <section className="p-5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="personel-liste" className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white">
                2
              </span>
              Personel <span className="font-normal text-zinc-400">(isteğe bağlı)</span>
            </label>
            {existing > 0 && (
              <span className="text-xs text-zinc-500">Şu an {existing} personel var</span>
            )}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            Her satıra bir personel:{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5">Ad; Görev; Telefon</code>
            <br />
            Excel&apos;den kopyalayıp yapıştırabilir veya CSV dosyası yükleyebilirsin.
            Başlık satırı otomatik atlanır.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              ref={dosyaGirdisi}
              id="personel-dosya"
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
              onChange={handleDosya}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => dosyaGirdisi.current?.click()}
              className="btn-ikincil btn-kucuk"
            >
              CSV / Excel dosyası seç
            </button>
            {dosyaAdi ? (
              <span className="text-xs text-zinc-500">{dosyaAdi} yüklendi</span>
            ) : (
              <span className="text-xs text-zinc-400">.csv, .tsv, .txt</span>
            )}
          </div>
          <textarea
            id="personel-liste"
            value={bulk}
            onChange={(e) => {
              setBulk(e.target.value);
              setDosyaAdi("");
            }}
            rows={6}
            placeholder={"Ad Soyad; Görev; Telefon\nAyşe Yılmaz; Barista; 0532 111 22 33\nMehmet Kaya; Garson; 0533 222 33 44\nZeynep Demir; Şef"}
            className="giris mt-3 font-mono text-[13px]"
          />
          {parsed.length > 0 && (
            <p className="mt-2 text-xs font-medium text-emerald-700">
              ✓ {parsed.length} personel algılandı
            </p>
          )}
        </section>

        {/* 3) Bitir */}
        <section className="p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              onClick={handleFinish}
              disabled={busy}
              className="btn-birincil h-11 px-6 text-sm"
            >
              3. Kur ve başla →
            </button>
            <button
              onClick={handleReset}
              disabled={busy}
              className="btn-tehlike h-11 text-sm"
            >
              Sıfırdan başla
            </button>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Hazır şablonlar: {sablonlar.map((s) => `${s.name} ${shiftSaatMetni(s)}`).join(" · ")}
          </p>
        </section>
      </div>

      {msg && <p className="mt-4 text-sm text-zinc-600">{msg}</p>}
    </main>
  );
}
