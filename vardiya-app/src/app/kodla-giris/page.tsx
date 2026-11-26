import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AuthKabuk from "@/components/AuthKabuk";
import KodAkisi from "@/components/KodAkisi";
import { aktifKullanici } from "@/lib/auth";
import { kaydetZiyaret } from "@/lib/visits";
import { DIL_COOKIE, dilOku, t } from "@/lib/dil";

export const metadata = {
  title: "Şifresiz giriş — Vardiya",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * **Şifresiz giriş** (e-posta kodu).
 *
 * Şifresini unutan ya da şifre yazmak istemeyen kullanıcı, e-postasına gelen
 * 6 haneli kodla giriş yapar. Kod tek kullanımlık ve 10 dakika geçerli.
 */
export default async function KodlaGirisPage({
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
      karsilama={t(dil, "auth.passwordlessTitle")}
      karsilamaAlt={t(dil, "auth.passwordlessSub")}
      baslik={t(dil, "auth.codeTitle")}
      alt={t(dil, "auth.codeSub")}
    >
      <KodAkisi
        amac="giris"
        baslangicEposta={email ?? ""}
        basariliBaglanti={{ href: "/panel", yazi: "Panele git" }}
      />

      <div className="auth-form-baglanti mt-5 border-t border-zinc-100 pt-5">
        <Link href="/giris">{t(dil, "auth.backToPassword")}</Link>
      </div>
    </AuthKabuk>
  );
}
