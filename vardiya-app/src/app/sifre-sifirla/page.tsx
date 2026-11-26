import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AuthKabuk from "@/components/AuthKabuk";
import KodAkisi from "@/components/KodAkisi";
import { aktifKullanici } from "@/lib/auth";
import { kaydetZiyaret } from "@/lib/visits";
import { DIL_COOKIE, dilOku, t } from "@/lib/dil";

export const metadata = {
  title: "Şifre sıfırla — Vardiya",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * "Şifremi unuttum" — **kod ile** sıfırlama.
 *
 * E-posta girilir, 6 haneli kod gönderilir, kod + yeni şifre ile işlem biter.
 * (Eski bağlantı akışı `/sifre-sifirla/yeni` yalnızca eski e-postalardaki
 * bağlantılar için duruyor.)
 *
 * Yanıt, adresin kayıtlı olup olmadığını **sızdırmaz**.
 */
export default async function SifreSifirlaPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  const kullanici = await aktifKullanici();
  if (kullanici) redirect("/panel");

  await kaydetZiyaret();

  const dil = dilOku((await cookies()).get(DIL_COOKIE)?.value);
  return (
    <AuthKabuk
      karsilama={t(dil, "auth.resetWelcome")}
      karsilamaAlt={t(dil, "auth.resetWelcomeSub")}
      baslik={t(dil, "auth.resetTitle")}
      alt={t(dil, "auth.resetSub")}
    >
      <KodAkisi amac="sifre" baslangicEposta={email ?? ""} />

      <p className="mt-4 text-[12px] leading-relaxed text-zinc-500">
        E-postana erişemiyorsan{" "}
        <a
          href="mailto:destek@zihnora.com.tr?subject=Vardiya%20hesap%20eri%C5%9Fimi"
          className="auth-baglanti"
        >
          destek@zihnora.com.tr
        </a>{" "}
        adresine yaz; aynı iş günü içinde dönüyoruz.
      </p>

      <div className="auth-form-baglanti mt-5 border-t border-zinc-100 pt-5">
        <Link href="/giris">{t(dil, "auth.backToLogin")}</Link>
      </div>
    </AuthKabuk>
  );
}
