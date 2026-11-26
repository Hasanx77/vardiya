"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * SQL paneli — salt-okunur sorgu arayüzü.
 *
 * Sunucu tarafı `sqlKontrol` yalnızca SELECT/WITH/EXPLAIN/PRAGMA'ya izin verir,
 * sonuç 200 satırla sınırlanır. Bu ekran bir phpMyAdmin değil; amaç veriyi
 * **görmek** (kaç kayıt var, kim ne zaman ne yaptı), değiştirmek değil.
 */
type Kolon = { ad: string; tur: string };
type Tablo = { ad: string; tur: string; satir: number; kolonlar: Kolon[] };
type Sonuc = {
  ok?: boolean;
  kolonlar?: string[];
  satirlar?: Record<string, unknown>[];
  toplam?: number;
  kesildi?: boolean;
  sureMs?: number;
  calisan?: string;
  hata?: string;
};

const ORNEKLER: { ad: string; sql: string }[] = [
  { ad: "Tablolar", sql: "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name" },
  { ad: "Son 10 kullanıcı", sql: 'SELECT email, username, createdAt, lastLoginAt FROM "User" ORDER BY createdAt DESC LIMIT 10' },
  { ad: "Personel sayısı", sql: 'SELECT COUNT(*) AS personel FROM "Employee"' },
  { ad: "Bu ay en çok vardiya", sql: 'SELECT employeeId, COUNT(*) AS vardiya FROM "Assignment" GROUP BY employeeId ORDER BY vardiya DESC LIMIT 10' },
  { ad: "Son 3 ay vardiya", sql: `SELECT date, COUNT(*) AS vardiya FROM "Assignment" WHERE date >= date('now','-3 months') GROUP BY date ORDER BY date DESC LIMIT 50` },
];

export default function SqlPanel() {
  const [tablolar, setTablolar] = useState<Tablo[]>([]);
  const [sorgu, setSorgu] = useState(ORNEKLER[0].sql);
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [acikTablo, setAcikTablo] = useState<string | null>(null);

  const tablolariYukle = useCallback(async () => {
    try {
      const r = await fetch("/api/sql/tablolar", { cache: "no-store" });
      const j = (await r.json()) as { tablolar?: Tablo[]; hata?: string };
      if (r.ok && j.tablolar) setTablolar(j.tablolar);
    } catch {
      /* sessiz: sorgu yine çalışır */
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void tablolariYukle();
    }, 0);
    return () => window.clearTimeout(t);
  }, [tablolariYukle]);

  async function calistir(sql = sorgu) {
    setYukleniyor(true);
    setHata(null);
    try {
      const r = await fetch("/api/sql", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sorgu: sql }),
      });
      const j = (await r.json().catch(() => ({}))) as Sonuc;
      if (!r.ok || !j.ok) {
        setSonuc(null);
        setHata(j.hata ?? "Sorgu çalıştırılamadı.");
        return;
      }
      setSonuc(j);
      setSorgu(sql);
    } catch {
      setHata("Bağlantı kurulamadı.");
    } finally {
      setYukleniyor(false);
    }
  }

  function csvIndir() {
    if (!sonuc?.kolonlar || !sonuc.satirlar) return;
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const satirlar = [
      sonuc.kolonlar.join(";"),
      ...sonuc.satirlar.map((s) => sonuc.kolonlar!.map((k) => esc(s[k])).join(";")),
    ];
    const blob = new Blob(["\uFEFF" + satirlar.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vardiya-sorgu.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <main className="kap py-5 sm:py-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Veritabanı</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight">SQL paneli</h1>
          <p className="mt-1 text-[13px] text-zinc-500">
            Salt-okunur: yalnızca <code className="rounded bg-zinc-100 px-1">SELECT / WITH / EXPLAIN / PRAGMA</code>.
            Sonuçlar 200 satırla sınırlı.
          </p>
        </div>
        <a href="/api/sql/yedek" className="btn-sessiz h-9 text-[12.5px]">
          Veritabanı yedeğini indir
        </a>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Tablolar */}
        <aside className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="px-1 text-[12px] font-semibold text-zinc-500">
            Tablolar ({tablolar.length})
          </h2>
          <ul className="mt-2 space-y-0.5">
            {tablolar.map((t) => (
              <li key={t.ad}>
                <button
                  type="button"
                  onClick={() => {
                    setAcikTablo(acikTablo === t.ad ? null : t.ad);
                    void calistir(`SELECT * FROM "${t.ad.replace(/"/g, '""')}" LIMIT 50`);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <span className="truncate font-medium">{t.ad}</span>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 text-[10.5px] text-zinc-500 dark:bg-zinc-800">
                    {t.satir < 0 ? "?" : t.satir}
                  </span>
                </button>
                {acikTablo === t.ad && t.kolonlar.length ? (
                  <ul className="mb-1 ml-3 border-l border-zinc-200 pl-3 text-[11.5px] text-zinc-500 dark:border-zinc-700">
                    {t.kolonlar.map((k) => (
                      <li key={k.ad} className="truncate">
                        {k.ad} <span className="text-zinc-400">{k.tur}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
            {tablolar.length === 0 ? (
              <li className="px-2 py-2 text-[12px] text-zinc-500">Tablo bulunamadı.</li>
            ) : null}
          </ul>
        </aside>

        {/* Sorgu + sonuç */}
        <section className="min-w-0">
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {ORNEKLER.map((o) => (
                <button
                  key={o.ad}
                  type="button"
                  onClick={() => void calistir(o.sql)}
                  className="rounded-full border border-zinc-200 px-2.5 py-1 text-[11.5px] text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {o.ad}
                </button>
              ))}
            </div>
            <textarea
              value={sorgu}
              onChange={(e) => setSorgu(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") void calistir();
              }}
              rows={5}
              spellCheck={false}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-[12.5px] leading-relaxed text-zinc-800 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder='SELECT * FROM "Employee" LIMIT 20'
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void calistir()}
                disabled={yukleniyor}
                className="btn-birincil h-9 text-[12.5px] disabled:opacity-50"
              >
                {yukleniyor ? "Çalışıyor…" : "Çalıştır (Ctrl+Enter)"}
              </button>
              {sonuc?.satirlar?.length ? (
                <button type="button" onClick={csvIndir} className="btn-sessiz h-9 text-[12px]">
                  CSV indir
                </button>
              ) : null}
              <span className="text-[11.5px] text-zinc-500">
                {sonuc?.satirlar ? `${sonuc.toplam} satır · ${sonuc.sureMs} ms` : ""}
                {sonuc?.kesildi ? " · ilk 200 gösteriliyor" : ""}
              </span>
            </div>

            {hata ? (
              <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
                {hata}
              </p>
            ) : null}
          </div>

          {sonuc?.kolonlar?.length ? (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <table className="w-full border-collapse text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                    {sonuc.kolonlar.map((k) => (
                      <th key={k} className="whitespace-nowrap px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300">
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(sonuc.satirlar ?? []).map((s, i) => (
                    <tr key={i} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                      {sonuc.kolonlar!.map((k) => {
                        const v = s[k];
                        return (
                          <td key={k} className="max-w-[280px] truncate px-3 py-1.5 text-zinc-700 dark:text-zinc-200" title={v === null || v === undefined ? "" : String(v)}>
                            {v === null || v === undefined ? <span className="text-zinc-300">—</span> : String(v)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <p className="mt-3 text-[11.5px] leading-relaxed text-zinc-500">
            Bu ekran yalnızca sende görünür. Sorgular çalıştırılmadan önce sunucuda doğrulanır;
            yazma/silme komutları reddedilir. Yedek dosyası tüm veritabanını içerir — indirdiğin
            dosyayı güvenli bir yerde tut.
          </p>
        </section>
      </div>
    </main>
  );
}
