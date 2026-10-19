import Link from "next/link";

export const metadata = {
  title: "Ücretsiz kayıt ol — Vardiya",
  description:
    "Kafe ve restoranlar için vardiya yönetimi. E-posta ile 30 saniyede ücretsiz hesap aç; kredi kartı istemiyoruz.",
};

/** Kayıt formu. Hatalar sunucudan ?hata=... ile döner. */
export default async function KayitPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; email?: string; isletme?: string; next?: string }>;
}) {
  const { hata, email, isletme, next } = await searchParams;
  const hedef = next && next.startsWith("/") && !next.startsWith("//") ? next : "/basla";

  return (
    <main className="flex-1 grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Ücretsiz hesap aç</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Kredi kartı istemiyoruz. E-posta ve şifre yeter — 30 saniyede hazır.
          </p>

          {hata ? (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {hata}
            </p>
          ) : null}

          <form action="/api/auth/register" method="post" className="mt-5 space-y-4">
            <input type="hidden" name="next" value={hedef} />

            <div>
              <label className="block text-sm font-medium text-zinc-700" htmlFor="isletme">
                İşletme adı <span className="font-normal text-zinc-400">(isteğe bağlı)</span>
              </label>
              <input
                id="isletme"
                name="isletme"
                type="text"
                defaultValue={isletme ?? ""}
                placeholder="Örn. Kahve Durağı"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>

            <div>
              <span className="block text-sm font-medium text-zinc-700">
                Standart mesai saatleriniz
              </span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="acilis"
                  name="acilis"
                  type="time"
                  defaultValue="09:00"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
                <span className="text-zinc-400">–</span>
                <input
                  id="kapanis"
                  name="kapanis"
                  type="time"
                  defaultValue="23:00"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Vardiya şablonları (Sabah / Akşam / Tam Gün / Ara) bu saatlerden otomatik oluşur.
                Sonradan panelden değiştirebilirsin.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700" htmlFor="email">
                E-posta
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
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
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="En az 8 karakter"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Şifren sunucuda <strong>şifrelenmiş (hash)</strong> saklanır; kimse okuyamaz.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700" htmlFor="sifreTekrar">
                Şifre (tekrar)
              </label>
              <input
                id="sifreTekrar"
                name="sifreTekrar"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Hesabımı oluştur →
            </button>
          </form>

          <p className="mt-4 text-xs text-zinc-500">
            Kayıt olarak verilerinin yalnızca sana ait olduğunu, dilediğin an{" "}
            <Link href="/gizlilik" className="underline hover:text-zinc-900">
              indirip silebileceğini
            </Link>{" "}
            kabul etmiş olursun.
          </p>
        </div>

        <p className="mt-4 text-center text-sm text-zinc-500">
          Zaten hesabın var mı?{" "}
          <Link href="/giris" className="font-medium text-zinc-900 underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </main>
  );
}
