import Link from "next/link";
import { redirect } from "next/navigation";
import AuthKabuk from "@/components/AuthKabuk";
import SifreAlani from "@/components/SifreAlani";
import { aktifKullanici } from "@/lib/auth";
import { kaydetZiyaret } from "@/lib/visits";
import { guvenliHedef } from "@/lib/url";

export const metadata = {
  title: "Ücretsiz kayıt ol — Vardiya",
  description:
    "Kafe ve restoranlar için vardiya yönetimi. E-posta ile 30 saniyede ücretsiz hesap aç; kredi kartı istemiyoruz.",
};

export const dynamic = "force-dynamic";

/** Kayıt formu. Hatalar sunucudan ?hata=... ile döner. */
export default async function KayitPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; email?: string; isletme?: string; next?: string }>;
}) {
  const { hata, email, isletme, next } = await searchParams;
  const hedefHam = guvenliHedef(next ?? "", "/basla");
  const hedef = hedefHam.startsWith("/kayit") || hedefHam.startsWith("/giris") ? "/panel" : hedefHam;

  // Zaten giriş yapılmışsa kayıt formunu tekrar gösterme.
  const kullanici = await aktifKullanici();
  if (kullanici) redirect(hedef);

  await kaydetZiyaret();

  return (
    <AuthKabuk baslik="Ücretsiz hesap aç" alt="Kredi kartı istemiyoruz. E-posta ve şifre yeter.">
      {hata ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {hata}
        </p>
      ) : null}

      <form action="/api/auth/register" method="post" className="mt-5 space-y-5">
        <input type="hidden" name="next" value={hedef} />

        {/* Bot tuzağı — ekranda görünmez, klavye ile ulaşılmaz. */}
        <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <fieldset className="space-y-3">
          <legend className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            İşletme
          </legend>

          <div>
            <label className="etiket" htmlFor="isletme">
              İşletme adı <span className="font-normal text-zinc-400">(isteğe bağlı)</span>
            </label>
            <input
              id="isletme"
              name="isletme"
              type="text"
              defaultValue={isletme ?? ""}
              placeholder="Örn. Kahve Durağı"
              className="giris mt-1"
            />
          </div>

          <div>
            <span className="etiket">Standart mesai saatleri</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="acilis"
                name="acilis"
                type="time"
                defaultValue="09:00"
                aria-label="Açılış saati"
                className="giris"
              />
              <span className="text-zinc-400">–</span>
              <input
                id="kapanis"
                name="kapanis"
                type="time"
                defaultValue="23:00"
                aria-label="Kapanış saati"
                className="giris"
              />
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
              Sabah / Akşam / Tam Gün / Ara vardiya şablonları bu saatlerden oluşur.
            </p>
          </div>
        </fieldset>

        <fieldset className="space-y-3 border-t border-zinc-100 pt-4">
          <legend className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Hesap
          </legend>

          <div>
            <label className="etiket" htmlFor="email">
              E-posta
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
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
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Şifren sunucuda geri döndürülemez biçimde (hash) saklanır; kimse okuyamaz.
          </p>
        </fieldset>

        <button type="submit" className="btn-birincil h-11 w-full text-sm">
          Hesabımı oluştur →
        </button>
      </form>

      <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
        Kayıt olarak verilerinin yalnızca sana ait olduğunu ve dilediğin an{" "}
        <Link href="/gizlilik" className="underline hover:text-zinc-800">
          indirip silebileceğini
        </Link>{" "}
        kabul etmiş olursun.
      </p>

      <p className="mt-5 border-t border-zinc-100 pt-4 text-sm text-zinc-500">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-medium text-zinc-900 underline underline-offset-2">
          Giriş yap
        </Link>
      </p>
    </AuthKabuk>
  );
}
