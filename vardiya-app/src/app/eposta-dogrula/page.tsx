import Link from "next/link";
import AuthKabuk from "@/components/AuthKabuk";
import KodAkisi from "@/components/KodAkisi";
import { oturumGerekli } from "@/lib/oturum";

export const metadata = {
  title: "E-posta doğrula — Vardiya",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Oturumdaki kullanıcının e-posta adresini **kodla** doğrular.
 *
 * Neden gerekli: şifre sıfırlama ve şifresiz giriş e-posta sahipliğine dayanır.
 * Doğrulanmamış adres, hesabın sahibi olmayan birine geçmiş olabilir.
 */
export default async function EpostaDogrulaPage() {
  const kullanici = await oturumGerekli("/eposta-dogrula");

  return (
    <AuthKabuk
      karsilama="Son bir adım."
      karsilamaAlt="E-posta adresini doğrula; şifre sıfırlama ve şifresiz giriş güvenle çalışsın."
      baslik={kullanici.emailVerifiedAt ? "E-posta doğrulanmış" : "E-postanı doğrula"}
      alt={
        kullanici.emailVerifiedAt
          ? "Bu adres zaten doğrulanmış. Yapacak bir şey yok."
          : "Adresine 6 haneli bir kod gönderiyoruz."
      }
    >
      <p className="mt-5 rounded-lg border border-[#2a2a30] bg-[#141417] px-3 py-2.5 text-[13px] text-[#c9c9d1]">
        Adres: <strong>{kullanici.email}</strong>
      </p>

      {kullanici.emailVerifiedAt ? (
        <div
          role="status"
          className="auth-uyari mt-4 border-[#3f4a3a] bg-[#1b211a] text-[#dbe7d6]"
        >
          <span className="auth-uyari-ikon" aria-hidden>
            ✓
          </span>
          <div>
            <p className="font-semibold">Doğrulanmış</p>
            <p className="mt-0.5">
              {new Intl.DateTimeFormat("tr-TR", {
                dateStyle: "medium",
                timeZone: "Europe/Istanbul",
              }).format(kullanici.emailVerifiedAt)}{" "}
              tarihinde doğrulandı.
            </p>
          </div>
        </div>
      ) : (
        <KodAkisi
          amac="dogrulama"
          sabitEposta={kullanici.email}
          basariliMetni="E-posta adresin doğrulandı."
          basariliBaglanti={{ href: "/panel", yazi: "Panele dön" }}
        />
      )}

      <div className="auth-form-baglanti mt-5 border-t border-zinc-100 pt-5">
        <Link href="/profil">← Profilime dön</Link>
      </div>
    </AuthKabuk>
  );
}
