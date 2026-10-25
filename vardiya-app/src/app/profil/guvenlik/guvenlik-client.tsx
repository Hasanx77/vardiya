"use client";

import { useState } from "react";

/**
 * İki adımlı doğrulama ayar ekranı.
 *
 * Kurulum: sır gösterilir → kullanıcı authenticator uygulamasına girer →
 * 6 haneli kodla onaylar → 10 yedek kod **bir kez** gösterilir.
 * Kapatma: şifre + geçerli kod birlikte istenir (çalınmış oturum tek başına
 * korumayı kaldıramasın).
 */
type Durum = { aktif: boolean; yedekKalan: number; kurulumVar: boolean };

type Asama = "bos" | "kurulum" | "yedek" | "kapat";

function grupla(sir: string): string {
  return sir.replace(/(.{4})/g, "$1 ").trim();
}

export default function GuvenlikClient({ baslangic }: { baslangic: Durum }) {
  const [durum, setDurum] = useState<Durum>(baslangic);
  const [asama, setAsama] = useState<Asama>("bos");
  const [sir, setSir] = useState("");
  const [adres, setAdres] = useState("");
  const [kod, setKod] = useState("");
  const [sifre, setSifre] = useState("");
  const [yedekKodlar, setYedekKodlar] = useState<string[]>([]);
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [mesgul, setMesgul] = useState(false);
  const [kopyalandi, setKopyalandi] = useState("");

  async function istek(govde: Record<string, unknown>) {
    setMesgul(true);
    setHata("");
    setBilgi("");
    try {
      const r = await fetch("/api/hesap/iki-adim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(govde),
      });
      const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      if (!r.ok) {
        setHata(String(j.hata ?? "İşlem tamamlanamadı."));
        return null;
      }
      return j;
    } catch {
      setHata("Bağlantı kurulamadı. Tekrar dene.");
      return null;
    } finally {
      setMesgul(false);
    }
  }

  async function baslat() {
    if (!sifre.trim()) {
      setHata("Devam etmek için şifreni yaz.");
      return;
    }
    const j = await istek({ islem: "baslat", sifre });
    if (!j) return;
    setSir(String(j.sir ?? ""));
    setAdres(String(j.adres ?? ""));
    setKod("");
    setAsama("kurulum");
  }

  async function etkinlestir() {
    const j = await istek({ islem: "etkinlestir", kod, sifre });
    if (!j) return;
    setYedekKodlar(Array.isArray(j.yedekKodlar) ? (j.yedekKodlar as string[]) : []);
    setDurum({ aktif: true, yedekKalan: 10, kurulumVar: true });
    setAsama("yedek");
  }

  async function kapat2fa() {
    const j = await istek({ islem: "kapat", kod, sifre });
    if (!j) return;
    setDurum({ aktif: false, yedekKalan: 0, kurulumVar: false });
    setYedekKodlar([]);
    setKod("");
    setSifre("");
    setAsama("bos");
    setBilgi("İki adımlı doğrulama kapatıldı.");
  }

  async function yenile() {
    const j = await istek({ islem: "yenile", kod });
    if (!j) return;
    setYedekKodlar(Array.isArray(j.yedekKodlar) ? (j.yedekKodlar as string[]) : []);
    setDurum((d) => ({ ...d, yedekKalan: 10 }));
    setKod("");
    setAsama("yedek");
  }

  async function kopyala(metin: string, etiket: string) {
    try {
      await navigator.clipboard.writeText(metin);
      setKopyalandi(etiket);
      setTimeout(() => setKopyalandi(""), 2000);
    } catch {
      setHata("Panoya kopyalanamadı. Kodu elle yaz.");
    }
  }

  return (
    <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">İki adımlı doğrulama</h2>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">
            Şifren çalınsa bile hesabına girilemez: girişte telefondaki
            uygulamadan üretilen 6 haneli kod da sorulur.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            durum.aktif
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200"
          }`}
        >
          {durum.aktif ? "Açık" : "Kapalı"}
        </span>
      </div>

      {durum.aktif ? (
        <p className="mt-3 text-sm text-zinc-600">
          Yedek kod: <strong>{durum.yedekKalan}</strong> adet kaldı.
          {durum.yedekKalan <= 3 ? (
            <span className="ml-1 text-amber-700">Azalıyor, yenilemen iyi olur.</span>
          ) : null}
        </p>
      ) : null}

      {hata ? (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {hata}
        </p>
      ) : null}
      {bilgi ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {bilgi}
        </p>
      ) : null}

      {/* KAPALI → kurulumu başlat */}
      {!durum.aktif && asama === "bos" ? (
        <div className="mt-4 max-w-sm">
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-600">
              Güvenlik için şifreni doğrula
            </span>
            <input
              type="password"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              autoComplete="current-password"
              className="giris"
            />
          </label>
          <button type="button" onClick={baslat} disabled={mesgul} className="btn-birincil mt-3">
            {mesgul ? "Hazırlanıyor…" : "İki adımlı doğrulamayı aç"}
          </button>
        </div>
      ) : null}

      {/* KURULUM */}
      {asama === "kurulum" ? (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-700">
            <li>Telefonuna Google Authenticator, Aegis veya Microsoft Authenticator kur.</li>
            <li>Uygulamada “kurulum anahtarını gir” seçeneğini seç.</li>
            <li>Aşağıdaki anahtarı yaz (boşluklar önemli değil), hesap adı: Vardiya.</li>
            <li>Uygulamanın gösterdiği 6 haneli kodu aşağıya gir.</li>
          </ol>

          <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-3">
            <div className="text-xs font-medium text-zinc-500">Kurulum anahtarı</div>
            <div className="mt-1 break-all font-mono text-sm tracking-wide text-zinc-900">
              {grupla(sir)}
            </div>
            <button
              type="button"
              onClick={() => kopyala(sir, "sir")}
              className="btn-ikincil mt-2 text-xs"
            >
              {kopyalandi === "sir" ? "Kopyalandı ✓" : "Anahtarı kopyala"}
            </button>
            {adres ? (
              <p className="mt-2 break-all font-mono text-[11px] text-zinc-400">{adres}</p>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-600">Şifren</span>
              <input
                type="password"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                autoComplete="current-password"
                className="giris w-44"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-600">Uygulamadaki kod</span>
              <input
                value={kod}
                onChange={(e) => setKod(e.target.value)}
                inputMode="numeric"
                maxLength={11}
                placeholder="123 456"
                className="giris w-40 text-center tracking-[0.3em]"
              />
            </label>
            <button type="button" onClick={etkinlestir} disabled={mesgul} className="btn-birincil">
              {mesgul ? "Kontrol ediliyor…" : "Onayla ve aç"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAsama("bos");
                setKod("");
                setHata("");
              }}
              className="btn-sessiz"
            >
              Vazgeç
            </button>
          </div>
        </div>
      ) : null}

      {/* YEDEK KODLAR */}
      {asama === "yedek" && yedekKodlar.length > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900">
            Yedek kodların — bu ekranı bir daha göstermeyeceğiz
          </h3>
          <p className="mt-1 text-sm text-amber-900/80">
            Telefonun kaybolursa bu kodlardan biriyle giriş yapabilirsin. Her kod
            <strong> bir kez</strong> çalışır. Güvenli bir yere kaydet.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm text-amber-950 sm:grid-cols-5">
            {yedekKodlar.map((k) => (
              <span key={k} className="rounded-md bg-white/70 px-2 py-1 text-center ring-1 ring-amber-200">
                {k}
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => kopyala(yedekKodlar.join("\n"), "yedek")}
              className="btn-ikincil text-xs"
            >
              {kopyalandi === "yedek" ? "Kopyalandı ✓" : "Hepsini kopyala"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAsama("bos");
                setYedekKodlar([]);
                setBilgi("İki adımlı doğrulama açıldı. Yedek kodları kaydettiğinden emin ol.");
              }}
              className="btn-birincil text-xs"
            >
              Kaydettim, kapat
            </button>
          </div>
        </div>
      ) : null}

      {/* AÇIK → yönetim */}
      {durum.aktif && asama === "bos" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setAsama("kapat");
              setKod("");
              setSifre("");
            }}
            className="btn-ikincil"
          >
            Yedek kodları yenile / kapat
          </button>
        </div>
      ) : null}

      {durum.aktif && asama === "kapat" ? (
        <div className="mt-4 grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:max-w-md">
          <p className="text-sm text-zinc-600">
            Yedek kodları yenilemek için yalnız kod yeter. Kapatmak için şifre de gerekir.
          </p>
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-600">Uygulamadaki 6 haneli kod</span>
            <input
              value={kod}
              onChange={(e) => setKod(e.target.value)}
              inputMode="numeric"
              maxLength={11}
              placeholder="123 456"
              className="giris text-center tracking-[0.3em]"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-600">Şifren (yalnız kapatmak için)</span>
            <input
              type="password"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="giris"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={yenile} disabled={mesgul} className="btn-birincil">
              Yedek kodları yenile
            </button>
            <button type="button" onClick={kapat2fa} disabled={mesgul} className="btn-tehlike">
              Korumayı kapat
            </button>
            <button
              type="button"
              onClick={() => {
                setAsama("bos");
                setKod("");
                setSifre("");
                setHata("");
              }}
              className="btn-sessiz"
            >
              Vazgeç
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
