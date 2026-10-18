/**
 * Sayfa geçişlerinde gösterilen iskelet (skeleton).
 * Amaç: kullanıcı tıkladığı an bir şey görsün — "boş ekran beklemek" akıcılığı bozar.
 */
export default function Iskelet({ satir = 4 }: { satir?: number }) {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-zinc-200" />
          <div className="h-9 w-28 animate-pulse rounded-lg bg-zinc-200" />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-zinc-200 bg-white"
            />
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {Array.from({ length: satir }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-xl border border-zinc-200 bg-white"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-zinc-400">Yükleniyor…</p>
      </div>
    </main>
  );
}
