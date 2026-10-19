"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Oge = { href: string; ad: string; ikon: React.ReactNode };

const ikonSinif = "h-[18px] w-[18px]";

const ogeler: Oge[] = [
  {
    href: "/panel",
    ad: "Plan",
    ikon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={ikonSinif} aria-hidden>
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
        <path d="M3 9h18M8 3v3M16 3v3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/bugun",
    ad: "Bugün",
    ikon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={ikonSinif} aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/raporlar",
    ad: "Raporlar",
    ikon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={ikonSinif} aria-hidden>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/takvim",
    ad: "Takvim",
    ikon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={ikonSinif} aria-hidden>
        <rect x="3" y="4" width="18" height="17" rx="2.5" />
        <path d="M3 9h18M8 3v3M16 3v3" strokeLinecap="round" />
        <path d="M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2" strokeLinecap="round" />
      </svg>
    ),
  },
];

function aktifMi(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Masaüstü üst menü — yalnızca giriş yapılmışken görünür. */
export function UstMenu() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-0.5 sm:flex" aria-label="Ana menü">
      {ogeler.map((o) => {
        const aktif = aktifMi(pathname, o.href);
        return (
          <Link
            key={o.href}
            href={o.href}
            aria-current={aktif ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
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
  );
}

/** Mobil alt menü — telefonda başparmakla erişilebilir. */
export function AltMenu() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      aria-label="Alt menü"
    >
      <div className="grid grid-cols-4">
        {ogeler.map((o) => {
          const aktif = aktifMi(pathname, o.href);
          return (
            <Link
              key={o.href}
              href={o.href}
              aria-current={aktif ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                aktif ? "text-zinc-900" : "text-zinc-500"
              }`}
            >
              <span
                className={`grid h-7 w-10 place-items-center rounded-full transition-colors ${
                  aktif ? "bg-zinc-100" : ""
                }`}
              >
                {o.ikon}
              </span>
              {o.ad}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
