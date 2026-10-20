"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Oge = { href: string; ad: string; sinif?: string };

/**
 * Tanıtım üst menüsü.
 *
 * Bağlantılar artık footer'da toplanmıyor: masaüstünde "Ücretsiz başla"
 * düğmesinin solunda tek tek duruyor, çubuğu dolduruyor.
 * Mobilde "Menü" düğmesi üç başlığa bölünmüş paneli açar.
 */
const bolumler: { baslik: string; ogeler: Oge[] }[] = [
  {
    baslik: "Tanıtım",
    ogeler: [
      { href: "/#ozellikler", ad: "Özellikler" },
      { href: "/#nasil", ad: "Nasıl çalışır", sinif: "hidden lg:inline-flex" },
      { href: "/#sss", ad: "Sık sorulanlar", sinif: "hidden xl:inline-flex" },
    ],
  },
  {
    baslik: "Kurumsal",
    ogeler: [{ href: "/hakkimizda", ad: "Hakkımızda" }],
  },
  {
    baslik: "Destek",
    ogeler: [
      { href: "/yardim", ad: "Yardım" },
      { href: "/iletisim", ad: "İletişim" },
      { href: "/gizlilik", ad: "Gizlilik", sinif: "hidden lg:inline-flex" },
    ],
  },
];

const tumOgeler = bolumler.flatMap((b) => b.ogeler);

function aktifMi(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return pathname === href;
}

export default function SiteMenusu() {
  const pathname = usePathname();
  const [acik, setAcik] = useState(false);
  const kutu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function disariTiklama(e: MouseEvent) {
      if (kutu.current && !kutu.current.contains(e.target as Node)) setAcik(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setAcik(false);
    }
    document.addEventListener("mousedown", disariTiklama);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", disariTiklama);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  // Rota değişince panel kapansın: bağlantılara tıklamak paneli kapatıyor.

  return (
    <>
      {/* Masaüstü: çubuğu dolduran tek tek bağlantılar */}
      <nav className="hidden items-center gap-0.5 md:flex" aria-label="Site menüsü">
        {tumOgeler.map((o) => {
          const aktif = aktifMi(pathname, o.href);
          return (
            <Link
              key={o.href}
              href={o.href}
              aria-current={aktif ? "page" : undefined}
              className={`${o.sinif ?? ""} menu-baglanti items-center rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                aktif
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              {o.ad}
            </Link>
          );
        })}
      </nav>

      {/* Mobil / tablet: üç başlığa bölünmüş panel */}
      <div className="relative md:hidden" ref={kutu}>
        <button
          type="button"
          onClick={() => setAcik((a) => !a)}
          aria-expanded={acik}
          aria-controls="site-menusu"
          aria-label="Site menüsünü aç"
          className="menu-dugme grid h-9 w-9 place-items-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]" aria-hidden>
            {acik ? (
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>

        {acik ? (
          <div
            id="site-menusu"
            className="fixed left-4 right-4 top-16 z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl"
          >
            {bolumler.map((b) => (
              <div key={b.baslik} className="mb-1 last:mb-0">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  {b.baslik}
                </p>
                {b.ogeler.map((o) => {
                  const aktif = aktifMi(pathname, o.href);
                  return (
                    <Link
                      key={o.href}
                      href={o.href}
                      onClick={() => setAcik(false)}
                      aria-current={aktif ? "page" : undefined}
                      className={`block rounded-lg px-3 py-2 text-sm ${
                        aktif
                          ? "bg-zinc-100 font-medium text-zinc-900"
                          : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                      }`}
                    >
                      {o.ad}
                    </Link>
                  );
                })}
              </div>
            ))}

            <div className="mt-2 grid gap-1.5 border-t border-zinc-100 pt-2">
              <Link
                href="/giris"
                onClick={() => setAcik(false)}
                className="block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Giriş yap
              </Link>
              <Link
                href="/kayit"
                onClick={() => setAcik(false)}
                className="block rounded-lg bg-amber-500 px-3 py-2 text-center text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
              >
                Ücretsiz başla
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
