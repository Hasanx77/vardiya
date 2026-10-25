import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AuthKabuk from "@/components/AuthKabuk";
import { IKI_ADIM_COOKIE, beklemeBilgi } from "@/lib/session";
import { guvenliHedef } from "@/lib/url";

export const metadata = {
  title: "İki adımlı doğrulama — Vardiya",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** E-postayı ekranda göstermek için maskeler: has***@gmail.com */
function maskele(eposta: string): string {
  const [ad, alan] = eposta.split("@");
  if (!alan) return eposta;
  const gorunen = ad.slice(0, Math.min(3, Math.max(1, ad.length - 1)));
  return `${gorunen}${"*".repeat(Math.max(2, ad.length - gorunen.length))}@${alan}`;
}

/**
 * İki adımlı doğrulama adımı.
 *
 * Şifre doğruysa `/api/auth/login` buraya yönlendirir; oturum çerezi HENÜZ
 * yoktur. Yalnızca 10 dakika geçerli, imzalı bir "bekleme" çerezi vardır.
 */
export default async function IkiAdimPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; next?: string }>;
}) {
  const { hata, next } = await searchParams;
  const hedef = guvenliHedef(next ?? "/panel");

  const cerezler = await cookies();
  const bilgi = await beklemeBilgi(cerezler.get(IKI_ADIM_COOKIE)?.value);
  if (!bilgi) redirect("/giris?hata=Do%C4%9Frulama%20s%C3%BCresi%20doldu.%20L%C3%BCtfen%20yeniden%20giri%C5%9F%20yap.");

  const kullanici = await prisma.user.findUnique({
    where: { id: bilgi.kullaniciId },
    select: { email: true },
  });
  if (!kullanici) redirect("/giris");

  return (
    <AuthKabuk
      karsilama="Bir adım kaldı."
      karsilamaAlt="Hesabın iki adımlı doğrulama ile korunuyor. Telefonundaki uygulamadan kodu gir."
      baslik="İki adımlı doğrulama"
      alt={`${maskele(kullanici.email)} hesabı için 6 haneli kod.`}
    >
      {hata ? (
        <div role="alert" className="auth-uyari auth-uyari-hata">
          <span className="auth-uyari-ikon" aria-hidden>
            !
          </span>
          <div>
            <p className="font-semibold">Doğrulanamadı</p>
            <p className="mt-0.5">{hata}</p>
          </div>
        </div>
      ) : null}

      <form action="/api/auth/iki-adim" method="post" className="mt-5 grid gap-3">
        <input type="hidden" name="next" value={hedef} />
        <label htmlFor="kod" className="text-[12px] font-medium text-[#a1a1aa]">
          Doğrulama kodu
        </label>
        <input
          id="kod"
          name="kod"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={11}
          required
          autoFocus
          placeholder="123 456"
          aria-describedby="kod-yardim"
          className="giris text-center text-[22px] tracking-[0.4em]"
        />
        <p id="kod-yardim" className="text-[12px] leading-relaxed text-[#8b8b94]">
          Uygulama yoksa <strong className="text-[#d4d4d8]">yedek kodlarından</strong>{" "}
          birini yazabilirsin (her kod bir kez çalışır).
        </p>
        <button type="submit" className="btn-birincil mt-1 justify-center">
          Doğrula ve giriş yap
        </button>
      </form>

      <p className="mt-4 text-center text-[12px] text-[#8b8b94]">
        Telefonun elinde değil mi?{" "}
        <a href="/yardim" className="text-[#ededf0] underline underline-offset-2">
          Yardım
        </a>
      </p>
    </AuthKabuk>
  );
}
