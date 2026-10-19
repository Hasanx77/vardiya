"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sunucu günlüğüne düşsün; kullanıcıya teknik ayrıntı göstermiyoruz.
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          Beklenmeyen hata
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Bir şeyler ters gitti.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Sayfayı yeniden denemek çoğu zaman yeterli olur. Sorun sürerse birkaç dakika
          sonra tekrar bak.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button onClick={reset} className="btn-birincil">
            Tekrar dene
          </button>
          <a href="/panel" className="btn-ikincil">
            Panele dön
          </a>
        </div>
      </div>
    </main>
  );
}
