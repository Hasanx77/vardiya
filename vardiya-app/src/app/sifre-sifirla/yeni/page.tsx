import Link from "next/link";
import AuthKabuk from "@/components/AuthKabuk";
import SifreAlani from "@/components/SifreAlani";
import { sifirlamaAnahtariGecerliMi } from "@/lib/sifre-sifirlama";

export const metadata = {
  title: "Yeni şifre belirle — Vardiya",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * "Şifremi unuttum" adım 2: e-postadaki bağlantıdan gelinir.
 * Anahtar geçersiz/süresi dolmuşsa form gösterilmez — kullanıcı boşa uğraşmasın.
 */
export default async function YeniSifrePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; hata?: string }>;
}) {
  const { token, hata } = await searchParams;
  const anahtar = (token ?? "").trim();
  const gecerli = anahtar ? await sifirlamaAnahtariGecerliMi(anahtar) : null;

  if (!gecerli) {
    return (
      <AuthKabuk
        karsilama="Bağlantının süresi geçmiş."
        karsilamaAlt="Güvenlik için sıfırlama bağlantıları 60 dakika geçerli ve yalnızca bir kez kullanılabilir."
        baslik="Yeni bağlantı iste"
        alt="Tek tıkla yeni bir sıfırlama e-postası gönderebilirsin."
      >
        <div className="mt-5 rounded-xl border border-[#3f3a2a] bg-[#221f18] p-4 text-[13px] leading-relaxed text-[#e8dcc4]">
          Bu bağlantı kullanılmış veya süresi dolmuş. Aşağıdan yeni bağlantı
          isteyebilirsin.
        </div>
        <Link href="/sifre-sifirla" className="btn-birincil mt-5 flex h-11 w-full items-center justify-center text-sm">
          Yeni bağlantı iste <span aria-hidden>→</span>
        </Link>
        <div className="auth-form-baglanti mt-5 border-t border-zinc-100 pt-5">
          <Link href="/giris">← Giriş sayfasına dön</Link>
        </div>
      </AuthKabuk>
    );
  }

  return (
    <AuthKabuk
      karsilama="Neredeyse hazır."
      karsilamaAlt="Yeni şifreni belirle; bu işlemden sonra diğer cihazlardaki oturumlar kapanır."
      baslik="Yeni şifre belirle"
      alt="En az 8 karakter. Tahmin edilmesi zor bir şifre seç."
    >
      {hata ? (
        <div role="alert" className="auth-uyari auth-uyari-hata">
          <span className="auth-uyari-ikon" aria-hidden>
            !
          </span>
          <div>
            <p className="font-semibold">Şifre değiştirilemedi</p>
            <p className="mt-0.5">{hata}</p>
          </div>
        </div>
      ) : null}

      <form action="/api/auth/sifre-yenile" method="post" className="mt-5 space-y-4">
        <input type="hidden" name="token" value={anahtar} />

        <SifreAlani
          id="sifre"
          name="sifre"
          label="Yeni şifre"
          autoComplete="new-password"
          minLength={8}
          placeholder="En az 8 karakter"
        />

        <SifreAlani
          id="sifreTekrar"
          name="sifreTekrar"
          label="Yeni şifre (tekrar)"
          autoComplete="new-password"
          minLength={8}
        />

        <p className="text-[11px] leading-relaxed text-zinc-500">
          Şifren sunucuda geri döndürülemez biçimde saklanır. Bu işlemden sonra
          tüm cihazlarda yeniden giriş yapman gerekir.
        </p>

        <button type="submit" className="btn-birincil !mt-5 h-11 w-full text-sm">
          Şifremi kaydet <span aria-hidden>→</span>
        </button>
      </form>

      <div className="auth-form-baglanti mt-5 border-t border-zinc-100 pt-5">
        <Link href="/giris">← Giriş sayfasına dön</Link>
      </div>
    </AuthKabuk>
  );
}
