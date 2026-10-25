import Link from "next/link";
import { redirect } from "next/navigation";
import AuthKabuk from "@/components/AuthKabuk";
import SifreAlani from "@/components/SifreAlani";
import GoogleGiris from "@/components/GoogleGiris";
import { aktifKullanici } from "@/lib/auth";
import { googleHazirMi, googleIstemciKimligi } from "@/lib/google";
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
  searchParams: Promise<{ hata?: string; email?: string; next?: string; yenilendi?: string }>;
}) {
  const { hata, email, next, yenilendi } = await searchParams;
  const hedefHam = guvenliHedef(next ?? "", "/panel");
  const hedef = hedefHam.startsWith("/giris") || hedefHam.startsWith("/kayit") ? "/panel" : hedefHam;

  // Zaten giriş yapılmışsa formu tekrar gösterme: doğrudan hedefe git.
  const kullanici = await aktifKullanici();
  if (kullanici) redirect(hedef);

  await kaydetZiyaret();

  const sifreHatasi = Boolean(hata && /hatalı/i.test(hata));

  return (
    <AuthKabuk
      karsilama="Tekrar hoş geldin."
      karsilamaAlt="Haftalık planın, ekibin ve raporların seni bekliyor."
      baslik="Giriş yap"
      alt="Hesabınla devam et."
    >
      {yenilendi === "1" ? (
        <div role="status" className="auth-uyari mt-5 border-[#3f4a3a] bg-[#1b211a] text-[#dbe7d6]">
          <span className="auth-uyari-ikon" aria-hidden>
            ✓
          </span>
          <div>
            <p className="font-semibold">Şifren güncellendi</p>
            <p className="mt-0.5">
              Güvenlik için diğer cihazlardaki oturumlar kapatıldı. Yeni
              şifrenle giriş yapabilirsin.
            </p>
          </div>
        </div>
      ) : null}

      {hata ? (
        <div role="alert" className="auth-uyari auth-uyari-hata">
          <span className="auth-uyari-ikon" aria-hidden>
            !
          </span>
          <div>
            <p className="font-semibold">Giriş yapılamadı</p>
            <p className="mt-0.5">{hata}</p>
            {sifreHatasi ? (
              <p className="mt-1 text-[#cfa9a9]">
                Caps Lock kapalı mı? Şifreni &quot;Göster&quot; ile kontrol
                edebilirsin.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {googleHazirMi() ? (
        <div className="mt-5">
          <GoogleGiris istemciKimligi={googleIstemciKimligi()} hedef={hedef} />
          <div className="auth-ayrac" aria-hidden>
            <span>veya e-posta ile</span>
          </div>
        </div>
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
            inputMode="email"
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
          placeholder="Şifren"
        />

        <div className="flex items-center justify-between gap-3 pt-0.5">
          <label
            htmlFor="hatirla"
            className="flex cursor-pointer select-none items-center gap-2 text-[12.5px] text-zinc-500"
          >
            <input
              id="hatirla"
              name="hatirla"
              type="checkbox"
              value="1"
              defaultChecked
              className="h-4 w-4 shrink-0 rounded border-zinc-300"
            />
            Bu cihazda 30 gün açık kal
          </label>
        </div>

        <button type="submit" className="btn-birincil !mt-5 h-11 w-full text-sm">
          Giriş yap <span aria-hidden>→</span>
        </button>
      </form>

      <p className="mt-4 text-[12px] leading-relaxed text-zinc-500">
        Şifreni mi unuttun?{" "}
        <Link href="/sifre-sifirla" className="auth-baglanti">
          E-posta ile sıfırla
        </Link>
        . E-postana erişemiyorsan{" "}
        <a
          href="mailto:destek@zihnora.com.tr?subject=Vardiya%20hesap%20eri%C5%9Fimi"
          className="auth-baglanti"
        >
          bize yaz
        </a>
        .
      </p>

      <div className="auth-form-baglanti mt-5 border-t border-zinc-100 pt-5">
        Hesabın yok mu? <Link href="/kayit">Ücretsiz kayıt ol</Link>
      </div>
    </AuthKabuk>
  );
}
