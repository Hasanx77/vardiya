import Link from "next/link";

export const metadata = {
  title: "Giriş — Vardiya",
  robots: { index: false, follow: false },
};

/**
 * Şifre ekranı. Oturum çerezi yoksa middleware buraya yönlendirir.
 * Form, /api/auth/login'e POST eder; doğru şifrede çerez verilip hedefe döner.
 */
export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; next?: string }>;
}) {
  const { hata, next } = await searchParams;
  const hedef = next && next.startsWith("/") && !next.startsWith("//") ? next : "/panel";

  return (
    <main className="flex-1 grid place-items-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Panele giriş</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Vardiya paneli şifreyle korunuyor.
          </p>

          {hata ? (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              Şifre yanlış. Tekrar dene.
            </p>
          ) : null}

          <form action="/api/auth/login" method="post" className="mt-5 space-y-3">
            <input type="hidden" name="next" value={hedef} />
            <label className="block text-sm font-medium text-zinc-700" htmlFor="sifre">
              Şifre
            </label>
            <input
              id="sifre"
              name="sifre"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Giriş yap
            </button>
          </form>

          <p className="mt-4 text-xs text-zinc-500">
            Şifreni unuttuysan: sunucudaki <code>APP_PASSWORD</code> değerini
            değiştirmen yeterli — eski oturumlar 30 gün içinde kendiliğinden düşer.
          </p>
        </div>

        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 hover:underline">
            ← Tanıtım sayfasına dön
          </Link>
        </p>
      </div>
    </main>
  );
}
