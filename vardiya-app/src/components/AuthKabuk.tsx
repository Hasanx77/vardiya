import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Giriş / kayıt sayfalarının ortak kabuğu.
 * Solda marka paneli (masaüstü), sağda form.
 */
export default function AuthKabuk({
  baslik,
  alt,
  children,
}: {
  baslik: string;
  alt: string;
  children: ReactNode;
}) {
  return (
    <main className="flex-1 px-4 py-8 sm:py-12">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_24px_70px_-40px_rgba(20,24,27,0.35)] md:grid-cols-[0.9fr_1.1fr]">
        {/* Marka paneli */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-8 text-white md:flex">
          <div
            className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-500/25 blur-3xl"
            aria-hidden="true"
          />
          <Link href="/" className="relative flex items-center gap-2 font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500 text-[13px] font-bold text-zinc-950">
              V
            </span>
            <span className="tracking-tight">Vardiya</span>
          </Link>

          <div className="relative my-8">
            <h2 className="text-2xl font-extrabold leading-snug tracking-tight">
              Haftalık plan,
              <br />
              5 dakikada hazır.
            </h2>
            <ul className="mt-5 space-y-2.5 text-sm text-zinc-300">
              <li className="flex gap-2">
                <span className="text-amber-400">✓</span> Excel tablosu yok
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400">✓</span> WhatsApp&apos;tan tek tık
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400">✓</span> 45 saat uyarısı
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400">✓</span> Türkiye&apos;de barındırılıyor
              </li>
            </ul>
          </div>

          <p className="text-xs text-zinc-400">
            Kredi kartı yok · abonelik yok · reklam yok
          </p>
        </aside>

        {/* Form */}
        <div className="p-6 sm:p-8">
          <div className="md:hidden">
            <Link href="/" className="inline-flex items-center gap-2 font-bold">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500 text-[13px] font-bold text-zinc-950">
                V
              </span>
              <span className="tracking-tight">Vardiya</span>
            </Link>
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight md:mt-0">{baslik}</h1>
          <p className="mt-1 text-sm text-zinc-500">{alt}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
