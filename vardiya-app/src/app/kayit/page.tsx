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
  title: "Ücretsiz kayıt ol — Vardiya",
  description:
    "Kafe ve restoranlar için vardiya yönetimi. E-posta ve şifreyle 20 saniyede ücretsiz hesap aç; kredi kartı istemiyoruz.",
};

export const dynamic = "force-dynamic";

/**
 * Kayıt formu — **tek adım**: e-posta + şifre.
 *
 * İşletme adı, mesai saatleri ve görünen ad bilinçli olarak buradan çıkarıldı:
 * uzun form kullanıcıyı kaçırıyordu. Bu bilgiler hesap açıldıktan sonra
 * `/basla` ekranında üç kısa adımda istenir.
 */
export default async function KayitPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; email?: string; next?: string }>;
}) {
  const { hata, email, next } = await searchParams;
  const hedefHam = guvenliHedef(next ?? "", "/basla");
  const hedef = hedefHam.startsWith("/kayit") || hedefHam.startsWith("/giris") ? "/basla" : hedefHam;

  // Zaten giriş yapılmışsa kayıt formunu tekrar gösterme.
  const kullanici = await aktifKullanici();
  if (kullanici) redirect(hedef);

  await kaydetZiyaret();

  return (
    <AuthKabuk
      karsilama="Aramıza hoş geldin."
      karsilamaAlt="İki alan, bir düğme. İlk planını birkaç dakikada hazırla."
      baslik="Ücretsiz hesap aç"
      alt="Sadece e-posta ve şifre. Gerisini birlikte, adım adım kuralım."
    >
      {hata ? (
        <div role="alert" className="auth-uyari auth-uyari-hata">
          <span className="auth-uyari-ikon" aria-hidden>
            !
          </span>
          <div>
            <p className="font-semibold">Hesap açılamadı</p>
            <p className="mt-0.5">{hata}</p>
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

      <form action="/api/auth/register" method="post" className="mt-5 space-y-4">
        <input type="hidden" name="next" value={hedef} />

        {/* Bot tuzağı — ekranda görünmez, klavye ile ulaşılmaz. */}
        <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

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
          autoComplete="new-password"
          minLength={8}
          placeholder="En az 8 karakter"
        />

        <SifreAlani
          id="sifreTekrar"
          name="sifreTekrar"
          label="Şifre (tekrar)"
          autoComplete="new-password"
          minLength={8}
        />

        <button type="submit" className="btn-birincil !mt-5 h-11 w-full text-sm">
          Hesabımı oluştur <span aria-hidden>→</span>
        </button>
      </form>

      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
        İşletme adını ve mesai saatlerini sonra soracağız — hesabı açtıktan
        hemen sonra, üç kısa adımda.
      </p>

      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
        Kayıt olarak verilerinin yalnızca sana ait olduğunu ve dilediğin an{" "}
        <Link href="/gizlilik" className="underline hover:text-zinc-800">
          indirip silebileceğini
        </Link>{" "}
        kabul etmiş olursun.
      </p>

      <p className="auth-form-baglanti mt-5 border-t border-zinc-100 pt-4">
        Zaten hesabın var mı? <Link href="/giris">Giriş yap</Link>
      </p>
    </AuthKabuk>
  );
}
