import Link from "next/link";
import { redirect } from "next/navigation";
import AuthKabuk from "@/components/AuthKabuk";
import KodAkisi from "@/components/KodAkisi";
import { aktifKullanici } from "@/lib/auth";
import { kaydetZiyaret } from "@/lib/visits";

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

  return (
    <AuthKabuk
      karsilama="Şifren aklında değil mi?"
      karsilamaAlt="Sorun değil. Kayıtlı e-posta adresine 6 haneli bir kod gönderiyoruz; kodla yeni şifreni belirle."
      baslik="Şifreni sıfırla"
      alt="E-postana kod gönderelim, yeni şifreni sen seç."
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
        <Link href="/giris">← Giriş sayfasına dön</Link>
      </div>
    </AuthKabuk>
  );
}
