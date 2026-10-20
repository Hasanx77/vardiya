"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ogeler = [
  { href: "/", ad: "Ana Sayfa" },
  { href: "/#ozellikler", ad: "Özellikler" },
  { href: "/#nasil", ad: "Nasıl Çalışır" },
  { href: "/hakkimizda", ad: "Hakkımızda" },
  { href: "/hakkimizda#kurucu", ad: "CEO" },
  { href: "/yardim", ad: "Yardım" },
];

function aktifMi(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return pathname === href;
}

/**
 * Tanıtım sayfalarının üst menüsü.
 * Masaüstünde tek tek bağlantılar; mobilde "Menü" düğmesiyle açılan panel.
 */
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

  return (
    <>
      {/* Masaüstü */}
      <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Site menüsü">
        {ogeler.map((o) => {
          const aktif = aktifMi(pathname, o.href);
          return (
            <Link
              key={o.href}
              href={o.href}
              aria-current={aktif ? "page" : undefined}
              className={`rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
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

      {/* Mobil */}
      <div className="relative lg:hidden" ref={kutu}>
        <button
          type="button"
          onClick={() => setAcik((a) => !a)}
          aria-expanded={acik}
          aria-controls="site-menusu"
          className="btn-ikincil btn-kucuk"
        >
          Menü
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-3.5 w-3.5 transition-transform ${acik ? "rotate-180" : ""}`}
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {acik ? (
          <div
            id="site-menusu"
            className="fixed left-4 right-4 top-16 z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg"
          >
            <div className="py-1 text-sm">
              {ogeler.map((o) => {
                const aktif = aktifMi(pathname, o.href);
                return (
                  <Link
                    key={o.href}
                    href={o.href}
                    onClick={() => setAcik(false)}
                    aria-current={aktif ? "page" : undefined}
                    className={`block rounded-lg px-3 py-2 ${
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
            <div className="border-t border-zinc-100 p-1">
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
                className="mt-1 block rounded-lg bg-zinc-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-zinc-700"
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
