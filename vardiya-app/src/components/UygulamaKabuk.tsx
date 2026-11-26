"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import Marka from "@/components/Marka";
import ThemeToggle from "@/components/ThemeToggle";
import { useDil } from "@/components/DilSaglayici";
import type { SozlukAnahtari } from "@/lib/dil";

/**
 * Giriş sonrası **uygulama kabuğu**.
 *
 * Pazarlama sitesi ile uygulama bilinçli olarak ayrı: giriş yaptıktan sonra üst
 * menü/altbilgi kaybolur, yerine sol sabit menü (masaüstü) ve alt menü (mobil)
 * gelir. Ekranın tamamı işe kalır.
 */
type Oge = { href: string; ad: SozlukAnahtari; ikon: ReactNode; sahip?: boolean };

const ikonSinif = "h-[18px] w-[18px]";

const ogeler: Oge[] = [
  {
    href: "/panel",
    ad: "nav.plan",
    ikon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={ikonSinif} aria-hidden>
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
        <path d="M3 9h18M8 3v3M16 3v3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/bugun",
    ad: "nav.today",
    ikon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={ikonSinif} aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/gecmis",
    ad: "nav.history",
    ikon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={ikonSinif} aria-hidden>
        <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
        <path d="M3 4v5h5M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/raporlar",
    ad: "nav.reports",
    ikon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={ikonSinif} aria-hidden>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/takvim",
    ad: "nav.calendar",
    ikon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={ikonSinif} aria-hidden>
        <rect x="3" y="4" width="18" height="17" rx="2.5" />
        <path d="M3 9h18M8 3v3M16 3v3" strokeLinecap="round" />
        <path d="M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/ekip",
    ad: "nav.team",
    ikon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={ikonSinif} aria-hidden>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3 20c0-3.2 2.7-5.2 6-5.2s6 2 6 5.2M17 11a2.6 2.6 0 1 0 0-5.2M17.5 20c0-2.2-.9-3.7-2.5-4.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/sql",
    ad: "nav.sql",
    sahip: true,
    ikon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={ikonSinif} aria-hidden>
        <ellipse cx="12" cy="6" rx="8" ry="3" />
        <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </svg>
    ),
  },
  {
    href: "/ayarlar",
    ad: "nav.settings",
    ikon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={ikonSinif} aria-hidden>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
    ),
  },
];

function aktifMi(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function UygulamaKabuk({
  children,
  kullanici,
  isletme,
  sahip,
}: {
  children: ReactNode;
  kullanici: { email: string; username: string | null };
  isletme: string;
  sahip: boolean;
}) {
  const pathname = usePathname();
  const { t } = useDil();
  const [daha, setDaha] = useState(false);
  const gorunen = ogeler.filter((o) => !o.sahip || sahip);
  const ad = kullanici.username ?? kullanici.email.split("@")[0];
  const bas = (kullanici.email[0] ?? "?").toUpperCase();

  const icerik = (
    <>
      {gorunen.map((o) => {
        const aktif = aktifMi(pathname, o.href);
        return (
          <Link
            key={o.href}
            href={o.href}
            aria-current={aktif ? "page" : undefined}
            className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors ${
              aktif
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`}
          >
            <span className={aktif ? "text-amber-400 dark:text-amber-600" : "text-zinc-400"}>{o.ikon}</span>
            {t(o.ad)}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="uygulama-kabuk flex min-h-[100svh] bg-[#f6f7f8] dark:bg-[#0b0d0f]">
      {/* Masaüstü sol menü */}
      <aside className="sticky top-0 hidden h-[100svh] w-[236px] shrink-0 flex-col border-r border-zinc-200 bg-white px-3 py-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex print:hidden">
        <Link href="/panel" className="mb-5 flex items-center gap-2 px-2" aria-label="Vardiya — panel">
          <Marka boyut={24} yazi nokta />
        </Link>

        <div className="mb-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{isletme}</p>
          <p className="truncate text-[11px] text-zinc-500">@{ad}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5" aria-label={t("nav.menu")}>
          {icerik}
        </nav>

        <div className="mt-4 space-y-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <div className="flex items-center justify-between px-1">
            <ThemeToggle />
          </div>
          <Link
            href="/profil"
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors ${
              aktifMi(pathname, "/profil")
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
              {bas}
            </span>
            {t("nav.profile")}
          </Link>
          {sahip ? (
            <Link
              href="/mesajlar"
              prefetch={false}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <span className="grid h-5 w-5 place-items-center text-zinc-400" aria-hidden>
                ✉
              </span>
              {t("nav.messages")}
            </Link>
          ) : null}
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
            >
              <span className="grid h-5 w-5 place-items-center" aria-hidden>
                ↪
              </span>
              {t("nav.logout")}
            </button>
          </form>
        </div>
      </aside>

      {/* Mobil üst şerit */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur sm:hidden dark:border-zinc-800 dark:bg-zinc-900/95 print:hidden">
          <Link href="/panel" className="flex items-center gap-2" aria-label="Vardiya — panel">
            <Marka boyut={22} yazi nokta />
          </Link>
          <div className="flex items-center gap-2">
            <span className="max-w-[110px] truncate text-[12px] font-medium text-zinc-600 dark:text-zinc-300">
              {isletme}
            </span>
            <Link
              href="/profil"
              className="grid h-8 w-8 place-items-center rounded-full bg-zinc-900 text-[12px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              aria-label={t("nav.profile")}
            >
              {bas}
            </Link>
          </div>
        </header>

        <div id="icerik" className="min-w-0 flex-1 pb-20 sm:pb-0">
          {children}
        </div>
      </div>

      {/* Mobil alt menü */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden dark:border-zinc-800 dark:bg-zinc-900/95 print:hidden"
        aria-label="Alt menü"
      >
        <div className="grid grid-cols-5">
          {gorunen.slice(0, 4).map((o) => {
            const aktif = aktifMi(pathname, o.href);
            return (
              <Link
                key={o.href}
                href={o.href}
                aria-current={aktif ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2 text-[10.5px] font-medium ${
                  aktif ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500"
                }`}
              >
                <span className={`grid h-7 w-10 place-items-center rounded-full ${aktif ? "bg-amber-50 text-amber-700 dark:bg-amber-500/15" : ""}`}>
                  {o.ikon}
                </span>
                {t(o.ad)}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setDaha((d) => !d)}
            aria-expanded={daha}
            className="flex flex-col items-center gap-1 py-2 text-[10.5px] font-medium text-zinc-500"
          >
            <span className="grid h-7 w-10 place-items-center rounded-full">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={ikonSinif} aria-hidden>
                <circle cx="5" cy="12" r="1.4" />
                <circle cx="12" cy="12" r="1.4" />
                <circle cx="19" cy="12" r="1.4" />
              </svg>
            </span>
            {t("nav.more")}
          </button>
        </div>

        {daha ? (
          <div className="border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="grid grid-cols-2 gap-2">
              {gorunen.slice(4).map((o) => (
                <Link
                  key={o.href}
                  href={o.href}
                  onClick={() => setDaha(false)}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-[12.5px] font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                >
                  {t(o.ad)}
                </Link>
              ))}
              <Link href="/profil" onClick={() => setDaha(false)} className="rounded-xl border border-zinc-200 px-3 py-2 text-[12.5px] font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
                {t("nav.profile")}
              </Link>
              {sahip ? (
                <Link href="/mesajlar" prefetch={false} onClick={() => setDaha(false)} className="rounded-xl border border-zinc-200 px-3 py-2 text-[12.5px] font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
                  {t("nav.messages")}
                </Link>
              ) : null}
              <form action="/api/auth/logout" method="post" className="col-span-2">
                <button type="submit" className="w-full rounded-xl border border-red-200 px-3 py-2 text-[12.5px] font-medium text-red-700">
                  {t("nav.logout")}
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </nav>
    </div>
  );
}
