"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Sağ üstteki profil menüsü (giriş yapılmışken görünür).
 * Avatar = e-postanın ilk harfi. Tıklayınca menü açılır; dışına tıklayınca kapanır.
 */
export default function ProfilMenusu({ email, sahip }: { email: string; sahip?: boolean }) {
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

  const harf = (email.trim()[0] ?? "?").toUpperCase();

  return (
    <div className="relative" ref={kutu}>
      <button
        type="button"
        onClick={() => setAcik((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={acik}
        title={email}
        className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white py-1 pl-1 pr-3 text-sm transition-colors hover:bg-zinc-100"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
          {harf}
        </span>
        <span className="hidden max-w-[140px] truncate text-zinc-700 sm:inline">
          {email.split("@")[0]}
        </span>
      </button>

      {acik ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
        >
          <div className="border-b border-zinc-100 px-4 py-3">
            <div className="text-xs text-zinc-500">Giriş yapılan hesap</div>
            <div className="truncate text-sm font-medium text-zinc-900">{email}</div>
          </div>
          <div className="py-1 text-sm">
            <Link
              href="/profil"
              onClick={() => setAcik(false)}
              className="block px-4 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              Profilim
            </Link>
            <Link
              href="/panel"
              onClick={() => setAcik(false)}
              className="block px-4 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              Panele git
            </Link>
            <Link
              href="/ekip"
              onClick={() => setAcik(false)}
              className="block px-4 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              Personel görünümü
            </Link>
            {sahip ? (
              <Link
                href="/mesajlar"
                prefetch={false}
                onClick={() => setAcik(false)}
                className="block px-4 py-2 text-zinc-700 hover:bg-zinc-100"
              >
                Gelen mesajlar
              </Link>
            ) : null}
            <Link
              href="/gizlilik"
              onClick={() => setAcik(false)}
              className="block px-4 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              Gizlilik ve verilerim
            </Link>
            <Link
              href="/yardim"
              onClick={() => setAcik(false)}
              className="block px-4 py-2 text-zinc-700 hover:bg-zinc-100"
            >
              Yardım
            </Link>
          </div>
          <form action="/api/auth/logout" method="post" className="border-t border-zinc-100">
            <button
              type="submit"
              className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Çıkış yap
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
