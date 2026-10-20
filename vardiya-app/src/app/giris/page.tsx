import Link from "next/link";
import { redirect } from "next/navigation";
import AuthKabuk from "@/components/AuthKabuk";
import SifreAlani from "@/components/SifreAlani";
import { aktifKullanici } from "@/lib/auth";
import { kaydetZiyaret } from "@/lib/visits";
import { guvenliHedef } from "@/lib/url";

export const metadata = {
  title: "Giriş yap — Vardiya",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Giriş formu: e-posta + şifre. Hatalar sunucudan ?hata=... ile döner. */
export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; email?: string; next?: string }>;
}) {
  const { hata, email, next } = await searchParams;
  const hedefHam = guvenliHedef(next ?? "", "/panel");
  const hedef = hedefHam.startsWith("/giris") || hedefHam.startsWith("/kayit") ? "/panel" : hedefHam;

  // Zaten giriş yapılmışsa formu tekrar gösterme: doğrudan hedefe git.
  const kullanici = await aktifKullanici();
  if (kullanici) redirect(hedef);

  await kaydetZiyaret();

  return (
    <AuthKabuk baslik="Giriş yap" alt="Hesabınla devam et.">
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
          <label className="etiket" htmlFor="email">
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
            className="giris mt-1"
          />
        </div>

        <SifreAlani
          id="sifre"
          name="sifre"
          label="Şifre"
          autoComplete="current-password"
        />

        <button type="submit" className="btn-birincil h-11 w-full text-sm">
          Giriş yap
        </button>
      </form>

      <p className="mt-4 text-xs leading-relaxed text-zinc-500">
        Şifreni hatırlamıyorsan hesabınla ilişkili e-postadan bize yaz:{" "}
        <a href="mailto:destek@zihnora.com.tr" className="underline hover:text-zinc-800">
          destek@zihnora.com.tr
        </a>
      </p>

      <p className="mt-5 border-t border-zinc-100 pt-4 text-sm text-zinc-500">
        Hesabın yok mu?{" "}
        <Link href="/kayit" className="font-medium text-zinc-900 underline underline-offset-2">
          Ücretsiz kayıt ol
        </Link>
      </p>
    </AuthKabuk>
  );
}
