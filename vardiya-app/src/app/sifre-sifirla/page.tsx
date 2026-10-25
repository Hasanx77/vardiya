import Link from "next/link";
import { redirect } from "next/navigation";
import AuthKabuk from "@/components/AuthKabuk";
import { aktifKullanici } from "@/lib/auth";
import { kaydetZiyaret } from "@/lib/visits";

export const metadata = {
  title: "Şifre sıfırla — Vardiya",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * "Şifremi unuttum" adımı 1: e-posta adresini al, sıfırlama bağlantısı gönder.
 * Yanıt, adresin kayıtlı olup olmadığını **sızdırmaz** (hesap numaralandırma
 * saldırısını önlemek için her durumda aynı mesaj gösterilir).
 */
export default async function SifreSifirlaPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; gonderildi?: string; email?: string }>;
}) {
  const { hata, gonderildi, email } = await searchParams;

  const kullanici = await aktifKullanici();
  if (kullanici) redirect("/panel");

  await kaydetZiyaret();

  const basarili = gonderildi === "1";

  return (
    <AuthKabuk
      karsilama="Şifren aklında değil mi?"
      karsilamaAlt="Sorun değil. Kayıtlı e-posta adresine tek kullanımlık bir bağlantı gönderiyoruz."
      baslik={basarili ? "E-postanı kontrol et" : "Şifreni sıfırla"}
      alt={
        basarili
          ? "Bağlantı birkaç saniye içinde gelir."
          : "Kayıtlı e-posta adresini yaz; sıfırlama bağlantısı gönderelim."
      }
    >
      {hata ? (
        <div role="alert" className="auth-uyari auth-uyari-hata">
          <span className="auth-uyari-ikon" aria-hidden>
            !
          </span>
          <div>
            <p className="font-semibold">İstek gönderilemedi</p>
            <p className="mt-0.5">{hata}</p>
          </div>
        </div>
      ) : null}

      {basarili ? (
        <div role="status" className="auth-uyari mt-5 border-[#3f4a3a] bg-[#1b211a] text-[#dbe7d6]">
          <span className="auth-uyari-ikon" aria-hidden>
            ✓
          </span>
          <div>
            <p className="font-semibold">Bağlantı yolda</p>
            <p className="mt-0.5">
              {email ? (
                <>
                  <strong>{email}</strong> adresine bir e-posta gönderdik.
                </>
              ) : (
                "Kayıtlı adrese bir e-posta gönderdik."
              )}{" "}
              Bağlantı <strong>60 dakika</strong> geçerli ve yalnızca bir kez
              kullanılabilir.
            </p>
            <p className="mt-1 text-[#9fb59a]">
              Gelen kutunda yoksa spam/gereksiz klasörüne bak. Birkaç dakika
              içinde gelmezse tekrar isteyebilirsin.
            </p>
          </div>
        </div>
      ) : (
        <form action="/api/auth/sifre-sifirla" method="post" className="mt-5 space-y-4">
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

          <button type="submit" className="btn-birincil !mt-5 h-11 w-full text-sm">
            Sıfırlama bağlantısı gönder <span aria-hidden>→</span>
          </button>
        </form>
      )}

      <p className="mt-4 text-[12px] leading-relaxed text-zinc-500">
        E-posta adresini hatırlamıyor musun?{" "}
        <a href="mailto:destek@zihnora.com.tr?subject=Vardiya%20hesap%20eri%C5%9Fimi" className="auth-baglanti">
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
