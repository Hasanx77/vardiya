import Link from "next/link";

export const metadata = {
  title: "Giriş yap — Vardiya",
  robots: { index: false, follow: false },
};

/** Giriş formu: e-posta + şifre. Hatalar sunucudan ?hata=... ile döner. */
export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; email?: string; next?: string }>;
}) {
  const { hata, email, next } = await searchParams;
  const hedef = next && next.startsWith("/") && !next.startsWith("//") ? next : "/panel";

  return (
    <main className="flex-1 grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Giriş yap</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Vardiya hesabınla devam et.
          </p>

          {hata ? (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {hata}
            </p>
          ) : null}

          <form action="/api/auth/login" method="post" className="mt-5 space-y-4">
            <input type="hidden" name="next" value={hedef} />

            <div>
              <label className="block text-sm font-medium text-zinc-700" htmlFor="email">
                E-posta
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                defaultValue={email ?? ""}
                placeholder="ornek@isletmem.com"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700" htmlFor="sifre">
                Şifre
              </label>
              <input
                id="sifre"
                name="sifre"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Giriş yap
            </button>
          </form>

          <p className="mt-4 text-xs text-zinc-500">
            Şifreni mi unuttun? Şimdilik e-posta ile sıfırlama yok — bu makinede
            yöneticiysen sunucudaki veritabanından yeni şifre atanabilir. Bize yaz, yardımcı olalım.
          </p>
        </div>

        <p className="mt-4 text-center text-sm text-zinc-500">
          Hesabın yok mu?{" "}
          <Link href="/kayit" className="font-medium text-zinc-900 underline">
            Ücretsiz kayıt ol
          </Link>
        </p>
      </div>
    </main>
  );
}
