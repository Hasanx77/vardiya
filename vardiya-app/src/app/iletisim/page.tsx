import type { Metadata } from "next";
import Link from "next/link";
import { kaydetZiyaret } from "@/lib/visits";

export const metadata: Metadata = {
  title: "İletişim — Vardiya",
  description:
    "Vardiya hakkında soru, öneri veya destek talebin için bize yaz. E-posta: destek@zihnora.com.tr",
  alternates: { canonical: "/iletisim" },
  openGraph: {
    title: "İletişim — Vardiya",
    description: "Soru, öneri ve destek taleplerin için bize ulaş.",
    url: "/iletisim",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function IletisimPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; hata?: string; ad?: string; email?: string; mesaj?: string }>;
}) {
  const { ok, hata, ad, email, mesaj } = await searchParams;
  await kaydetZiyaret();

  return (
    <main className="flex-1">
      <div className="kap py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
            İletişim
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] text-zinc-900 sm:text-5xl">
            Bir sorun mu var? Yaz, dönelim.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-600">
            Kurulum, vardiya planı, hesap veya faturalama ile ilgili her konuda bize
            ulaşabilirsin. Genellikle aynı gün içinde yanıt veriyoruz.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Form */}
            <section className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
              <h2 className="text-lg font-bold text-zinc-900">Mesaj gönder</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Formu doldur; mesajın doğrudan bize ulaşır.
              </p>

              {ok ? (
                <p
                  role="status"
                  className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
                >
                  <strong>Mesajın alındı.</strong> En kısa sürede e-posta ile dönüş
                  yapacağız.
                </p>
              ) : null}

              {hata ? (
                <p
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {hata}
                </p>
              ) : null}

              {ok ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href="/" className="btn-ikincil">
                    Ana sayfa
                  </Link>
                  <Link href="/yardim" className="btn-sessiz">
                    Yardım kılavuzu
                  </Link>
                </div>
              ) : (
                <form action="/api/iletisim" method="post" className="mt-5 space-y-4">
                  {/* Bot tuzağı — ekranda görünmez, klavye ile ulaşılmaz. */}
                  <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="etiket" htmlFor="ad">
                        Ad soyad
                      </label>
                      <input
                        id="ad"
                        name="ad"
                        type="text"
                        required
                        minLength={2}
                        maxLength={80}
                        autoComplete="name"
                        defaultValue={ad ?? ""}
                        placeholder="Adın Soyadın"
                        className="giris mt-1"
                      />
                    </div>
                    <div>
                      <label className="etiket" htmlFor="email">
                        E-posta
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        defaultValue={email ?? ""}
                        placeholder="ornek@isletmem.com"
                        className="giris mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="etiket" htmlFor="mesaj">
                      Mesajın
                    </label>
                    <textarea
                      id="mesaj"
                      name="mesaj"
                      required
                      minLength={10}
                      maxLength={3000}
                      rows={7}
                      defaultValue={mesaj ?? ""}
                      placeholder="Nasıl yardımcı olabiliriz?"
                      className="giris mt-1 resize-y"
                    />
                    <p className="mt-1 text-[11px] text-zinc-500">
                      En az 10 karakter. Telefon veya özel bilgi yazmana gerek yok.
                    </p>
                  </div>

                  <label className="flex items-start gap-2.5 text-[12px] leading-relaxed text-zinc-600">
                    <input
                      type="checkbox"
                      name="onay"
                      required
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 accent-amber-500"
                    />
                    <span>
                      Mesajımın yanıtlanması için verdiğim bilgilerin işlenmesini kabul
                      ediyorum.{" "}
                      <Link href="/gizlilik" className="underline hover:text-zinc-900">
                        Gizlilik ve KVKK aydınlatması
                      </Link>
                    </span>
                  </label>

                  <button type="submit" className="btn-birincil h-11 w-full text-sm">
                    Mesajı gönder <span aria-hidden>→</span>
                  </button>
                </form>
              )}
            </section>

            {/* İletişim bilgileri */}
            <aside className="space-y-4">
              <section className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold text-zinc-900">Doğrudan e-posta</h2>
                <a
                  href="mailto:destek@zihnora.com.tr"
                  className="mt-2 block break-all text-sm font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-800"
                >
                  destek@zihnora.com.tr
                </a>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  Yanıt süresi: genellikle aynı iş günü, en geç 2 iş günü.
                </p>
              </section>

              <section className="rounded-[20px] border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold text-zinc-900">Hemen cevap arayanlar</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link href="/yardim" className="text-zinc-700 underline hover:text-zinc-900">
                      Yardım kılavuzu
                    </Link>
                    <span className="block text-xs text-zinc-500">
                      Panel, personel ve raporların adım adım kullanımı.
                    </span>
                  </li>
                  <li>
                    <Link href="/#sss" className="text-zinc-700 underline hover:text-zinc-900">
                      Sık sorulan sorular
                    </Link>
                    <span className="block text-xs text-zinc-500">
                      Ücretsiz sürüm, veri güvenliği ve mevzuat uyarıları.
                    </span>
                  </li>
                  <li>
                    <Link href="/gizlilik" className="text-zinc-700 underline hover:text-zinc-900">
                      Gizlilik ve verilerim
                    </Link>
                    <span className="block text-xs text-zinc-500">
                      Verini indir, hesabını sil, KVKK hakların.
                    </span>
                  </li>
                </ul>
              </section>

              <section className="rounded-[20px] border border-amber-200 bg-amber-50 p-6">
                <h2 className="text-sm font-bold text-amber-900">Veri sorumlusu</h2>
                <p className="mt-2 text-xs leading-relaxed text-amber-900/80">
                  Vardiya · zihnora.com.tr · Türkiye&apos;de barındırılır. Kişisel
                  verilerin üçüncü taraflarla paylaşılmaz.
                </p>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
