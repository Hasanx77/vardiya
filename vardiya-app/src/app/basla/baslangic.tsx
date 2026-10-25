"use client";

import { useState } from "react";

/**
 * Başlangıç adımları — kayıttan sonraki ilk 60 saniye.
 *
 * Tasarım kararı: tek uzun form yerine **üç soru**, her ekranda tek iş.
 * Kullanıcı "azar azar" bilgi verir; hiçbir adımda iki alandan fazlası yok.
 * Alanlar aynı formda durur (gizli), böylece tek gönderimde hepsi kaydedilir.
 */
export default function Baslangic({
  varsayilanAd,
  hata,
}: {
  varsayilanAd: string;
  hata?: string;
}) {
  const [adim, setAdim] = useState(0);
  const [ad, setAd] = useState(varsayilanAd);
  const [marka, setMarka] = useState("");
  const [acilis, setAcilis] = useState("09:00");
  const [kapanis, setKapanis] = useState("23:00");
  const [uyari, setUyari] = useState<string | null>(null);

  const adGecerli = /^[a-z0-9][a-z0-9._-]{2,23}$/.test(ad.trim().toLowerCase());

  function ileri() {
    if (adim === 0 && !adGecerli) {
      setUyari("3-24 karakter: harf, rakam, nokta, tire. Harf veya rakamla başlasın.");
      return;
    }
    setUyari(null);
    setAdim((a) => Math.min(2, a + 1));
  }

  const adimlar = [
    {
      soru: "Sana nasıl hitap edelim?",
      alt: "Panelin sağ üstünde bu ad görünecek. E-postan görünmez.",
    },
    {
      soru: "İşletmenin adı ne?",
      alt: "Çizelgenin başlığında ve ekiplerine giden mesajlarda kullanılır.",
    },
    {
      soru: "Kaçta açıyorsun, kaçta kapatıyorsun?",
      alt: "Vardiya şablonları bu saatlerden üretilir. Sonra değiştirebilirsin.",
    },
  ];

  return (
    <main className="kap flex flex-1 items-center justify-center py-10">
      <div className="w-full max-w-lg">
        {/* Adım göstergesi */}
        <div className="mb-5 flex items-center gap-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= adim ? "bg-[#b45309]" : "bg-zinc-200 dark:bg-zinc-800"
              }`}
            />
          ))}
        </div>

        <div className="kart p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Adım {adim + 1} / 3
          </p>
          <h1 className="sayfa-baslik mt-2 text-2xl">{adimlar[adim].soru}</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">
            {adimlar[adim].alt}
          </p>

          {hata ? (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
              {hata}
            </p>
          ) : null}

          <form action="/api/hesap/baslangic" method="post" className="mt-5">
            {/* 1 — görünen ad */}
            <div className={adim === 0 ? "" : "hidden"}>
              <label className="etiket" htmlFor="username">
                Kullanıcı adı
              </label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-zinc-400">@</span>
                <input
                  id="username"
                  name="username"
                  value={ad}
                  onChange={(e) => setAd(e.target.value.toLowerCase())}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="giris"
                  placeholder="hasan"
                  required
                />
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Küçük harf, 3-24 karakter. Örn. <code>hasan</code>,{" "}
                <code>kahve.dunyasi</code>
              </p>
            </div>

            {/* 2 — marka */}
            <div className={adim === 1 ? "" : "hidden"}>
              <label className="etiket" htmlFor="isletme">
                İşletme / marka adı
              </label>
              <input
                id="isletme"
                name="isletme"
                value={marka}
                onChange={(e) => setMarka(e.target.value)}
                className="giris mt-1"
                placeholder="Kahve Dünyası"
                maxLength={80}
              />
              <p className="mt-1 text-[11px] text-zinc-500">
                Boş bırakırsan &quot;İşletmem&quot; yazar; panelden değiştirebilirsin.
              </p>
            </div>

            {/* 3 — mesai saatleri */}
            <div className={adim === 2 ? "" : "hidden"}>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="etiket" htmlFor="acilis">
                    Açılış
                  </label>
                  <input
                    id="acilis"
                    name="acilis"
                    type="time"
                    value={acilis}
                    onChange={(e) => setAcilis(e.target.value)}
                    className="giris mt-1"
                  />
                </div>
                <span className="mt-5 text-zinc-400" aria-hidden>
                  –
                </span>
                <div className="flex-1">
                  <label className="etiket" htmlFor="kapanis">
                    Kapanış
                  </label>
                  <input
                    id="kapanis"
                    name="kapanis"
                    type="time"
                    value={kapanis}
                    onChange={(e) => setKapanis(e.target.value)}
                    className="giris mt-1"
                  />
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                24 saat açıksan kapanışı <strong>23:59</strong> yaz. Sabah / Akşam /
                Tam Gün / Ara vardiya şablonları bu saatlerden oluşur.
              </p>
            </div>

            {uyari ? (
              <p role="alert" className="mt-3 text-[12px] text-red-700">
                {uyari}
              </p>
            ) : null}

            <div className="mt-6 flex items-center gap-2">
              {adim > 0 ? (
                <button
                  type="button"
                  onClick={() => setAdim((a) => Math.max(0, a - 1))}
                  className="btn-sessiz"
                >
                  Geri
                </button>
              ) : null}

              {adim < 2 ? (
                <button type="button" onClick={ileri} className="btn-birincil ml-auto">
                  Devam <span aria-hidden>→</span>
                </button>
              ) : (
                <button type="submit" className="btn-birincil ml-auto">
                  Panele geç <span aria-hidden>→</span>
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="mt-4 text-center text-[11px] text-zinc-500">
          Sonraki adımda personel ekleyip ilk planını hazırlayacağız. Acele yok —
          bu ekranı atlayıp panele geçebilirsin.
        </p>
      </div>
    </main>
  );
}
