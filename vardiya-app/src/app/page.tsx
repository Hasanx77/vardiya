import Link from "next/link";
import type { Metadata } from "next";
import { aktifKullanici } from "@/lib/auth";
import { demoOzet } from "@/lib/demo-data";
import { kaydetZiyaret } from "@/lib/visits";
import Marka from "@/components/Marka";
import LogoV from "@/components/LogoV";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/* ------------------------------------------------------------------
   İçerik — tek yerde, sade cümleler.
   ------------------------------------------------------------------ */

const ozellikler = [
  {
    baslik: "Haftalık plan ızgarası",
    metin:
      "Personel × gün tablosunda her hücreye tıkla, vardiya seç. Sürükleme, formül ve sekme yok.",
  },
  {
    baslik: "Excel / CSV içe aktarma",
    metin:
      "Mevcut listeyi Excel'den kopyalayıp yapıştır veya CSV yükle. Başlık satırı otomatik atlanır.",
  },
  {
    baslik: "WhatsApp'a hazır mesaj",
    metin:
      "Her personele kendi haftalık programı hazırlanır; mesajı tek tıkla WhatsApp'ta açarsın.",
  },
  {
    baslik: "Personele özel link",
    metin:
      "Çalışan giriş yapmadan kendi programını görür. Linki dilediğin an yenile veya kapat.",
  },
  {
    baslik: "Süre ve mevzuat uyarıları",
    metin:
      "45 saat, günlük 11 saat, 11 saat dinlenme, gece çalışması ve resmî tatil kontrolü plan yaparken görünür.",
  },
  {
    baslik: "Aylık rapor ve CSV",
    metin:
      "Kim kaç gün, kaç saat çalıştı? Aylık özeti görüntüle, Excel'e tek tıkla indir.",
  },
];

const adimlar = [
  {
    baslik: "Personelini ekle",
    metin:
      "Tek tek, Excel'den kopyalayıp yapıştırarak veya CSV yükleyerek. Ad, görev ve telefon yeterli.",
  },
  {
    baslik: "Haftayı doldur",
    metin:
      "Hazır şablonlardan seç. 45 saati aşan ve dinlenmesi yetersiz olanı anında gör.",
  },
  {
    baslik: "Mesajı hazırla",
    metin:
      "Her personel kendi programını alır; mesajı tek tıkla WhatsApp'ta açarsın. Personel giriş yapmadan telefondan görür.",
  },
];

const kontrolEdilen = [
  "Haftalık 45 saat (4857 m.63)",
  "Günlük en fazla 11 saat (m.63)",
  "İki vardiya arası 11 saat dinlenme (m.69)",
  "Aynı gün çift vardiya çakışması",
  "Gece çalışması 7,5 saat (m.69)",
  "2026–2027 tam gün resmî tatiller",
];

const kapsamDisi = [
  "Fazla mesai ücreti, puantaj ve bordro",
  "Yıllık izin bakiyesi ve otomatik düşüm",
  "Haftalık 24 saat kesintisiz hafta tatili",
  "İş sözleşmesi ve sektörel istisnalar",
  "Hukuki görüş veya mali müşavir denetimi",
];

const henuzYok = [
  "Çok şube ve müdür yetkileri",
  "Uygulama içi vardiya takası ve izin talebi",
  "Okundu bilgisi ve otomatik bildirim",
  "WhatsApp Business API ile toplu gönderim",
  "Muhasebe / bordro entegrasyonu",
];

const sss = [
  {
    soru: "Vardiya gerçekten ücretsiz mi?",
    cevap:
      "Evet. Sınırsız personel, sınırsız şablon ve bugünkü tüm özellikler ücretsiz. Kredi kartı, abonelik veya deneme süresi yok.",
  },
  {
    soru: "Kayıt olmadan ürünü görebilir miyim?",
    cevap:
      "Evet. Demo ekranında örnek bir işletmenin haftalık planını açıp hücrelere tıklayabilir, süre uyarılarını canlı görebilirsin. Demo yaptığın değişiklikleri kaydetmez.",
  },
  {
    soru: "Personel uygulama indirmek zorunda mı?",
    cevap:
      "Hayır. Personel sana ait bağlantıyı tarayıcıdan açar; mağaza veya hesap gerekmez. Sen de siteyi telefondan kullanabilir, 'Ana Ekrana Ekle' ile uygulama gibi açabilirsin.",
  },
  {
    soru: "Verilerim nerede saklanıyor?",
    cevap:
      "Türkiye'deki sunucuda, her işletmeye ait ayrı kayıtlar hâlinde tutulur. Ücret bilgisi istenmez ve saklanmaz. Verini profilinden JSON olarak indirebilir, hesabını silebilirsin.",
  },
  {
    soru: "Excel listemi yükleyebilir miyim?",
    cevap:
      "Evet. Personel listesini Excel'den olduğu gibi kopyalayıp yapıştırabilir veya .csv, .tsv, .txt dosyası yükleyebilirsin. Başlık satırı otomatik atlanır.",
  },
  {
    soru: "Marka Vardiya ama adres neden zihnora.com.tr?",
    cevap:
      "Vardiya ürünün adı; zihnora.com.tr yayın adresimiz ve Zihnora'nın ürünüdür. İki isim aynı ürünü gösterir; farklı bir şirket veya kopya site yok.",
  },
];

/* ------------------------------------------------------------------
   Örnek plan — /demo ekranıyla aynı kaynaktan (lib/demo-data).
   ------------------------------------------------------------------ */

const hucreRengi: Record<string, string> = {
  sabah: "border-[#e8ae55]/25 bg-[#e8ae55]/10 text-[#ecc383]",
  aksam: "border-[#8f7fe0]/25 bg-[#8f7fe0]/10 text-[#c8bef5]",
  tamgun: "border-[#d97a7a]/25 bg-[#d97a7a]/10 text-[#efb4b4]",
  ara: "border-[#6fb3c9]/25 bg-[#6fb3c9]/10 text-[#a9d8e4]",
};

function OrnekCizelge() {
  const ozet = demoOzet();

  return (
    <div className="mx-auto max-w-[1080px]">
      <div
        className="overflow-hidden rounded-xl border border-[#232327] bg-[#0d0d0f] shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)]"
        role="img"
        aria-label={`Örnek haftalık vardiya planı: ${ozet.kisi} personel, ${ozet.toplamVardiya} vardiya, ${ozet.uyari} süre uyarısı.`}
      >
        <div aria-hidden="true">
          {/* Pencere çubuğu */}
          <div className="flex items-center gap-2 border-b border-[#1c1c20] px-4 py-3">
            <span className="h-2 w-2 rounded-full bg-[#2f2f35]" />
            <span className="h-2 w-2 rounded-full bg-[#2f2f35]" />
            <span className="h-2 w-2 rounded-full bg-[#2f2f35]" />
            <span className="mx-auto rounded border border-[#232327] px-3 py-1 font-mono text-[10px] tracking-tight text-[#7d7d86]">
              zihnora.com.tr/panel
            </span>
            <span className="rounded border border-[#232327] px-2 py-0.5 text-[10px] font-medium text-[#8b8b93]">
              örnek veri
            </span>
          </div>

          <div className="px-3 pb-4 pt-5 sm:px-6 sm:pb-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-[14px] font-semibold tracking-tight text-[#ededf0]">
                  {ozet.isletme}
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#85858e]">
                  19 – 25 Ekim · Pzt–Paz
                </div>
              </div>
              <span className="rounded border border-[#232327] px-2.5 py-1 text-[11px] text-[#9a9aa2]">
                {ozet.kisi} personel
              </span>
            </div>

            <div className="mt-4 grid grid-cols-[44px_repeat(7,minmax(0,1fr))] gap-[3px] sm:grid-cols-[72px_repeat(7,minmax(0,1fr))] sm:gap-1">
              <div />
              {ozet.gunler.map((g) => (
                <div
                  key={g}
                  className="pb-1.5 text-center font-mono text-[9px] uppercase tracking-wider text-[#85858e] sm:text-[10px]"
                >
                  {g}
                </div>
              ))}

              {ozet.satirlar.map((s) => (
                <div key={s.id} className="contents">
                  <div className="flex min-w-0 items-center gap-1 py-1 text-[8.5px] text-[#b6b6bd] sm:gap-1.5 sm:text-[10.5px]">
                    <span
                      className={`hidden h-1.5 w-1.5 shrink-0 rounded-full sm:block ${s.renk}`}
                    />
                    <span className="truncate">{s.ad}</span>
                  </div>
                  {s.hucreler.map((h, i) => (
                    <div
                      key={i}
                      className={`my-0.5 truncate rounded border px-0.5 py-1 text-center text-[8.5px] leading-tight sm:px-1 sm:text-[9.5px] ${
                        h.tur
                          ? hucreRengi[h.tur] ?? "border-[#232327] bg-[#141417] text-[#9a9aa2]"
                          : "border-dashed border-[#232327] text-[#3c3c42]"
                      }`}
                    >
                      {h.etiket ?? "—"}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#1c1c20] pt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[#85858e]">
              <span>
                Toplam {ozet.toplamVardiya} vardiya · {ozet.calisan}/{ozet.kisi} kişi
              </span>
              <span className="flex items-center gap-1.5 text-[#c9a15c]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c9a15c]" />
                {ozet.uyari} uyarı
              </span>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-[#7d7d86]">
        Örnek veri · gerçek panel /panel adresinde
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function BolumBasligi({
  etiket,
  baslik,
  aciklama,
}: {
  etiket: string;
  baslik: string;
  aciklama?: string;
}) {
  return (
    <div className="max-w-[560px]">
      <p className="v-etiket">{etiket}</p>
      <h2 className="v-h2 mt-4">{baslik}</h2>
      {aciklama ? <p className="v-p mt-4">{aciklama}</p> : null}
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ hesap?: string }>;
}) {
  const { hesap } = await searchParams;
  await kaydetZiyaret();
  const kullanici = await aktifKullanici();

  const yapisalVeri = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://zihnora.com.tr/#kurum",
        name: "Vardiya",
        url: "https://zihnora.com.tr",
        logo: "https://zihnora.com.tr/icons/icon-512.png",
        description:
          "Kafe ve restoranlar için Türkçe, mevzuat uyarılarıyla haftalık vardiya yönetimi.",
      },
      {
        "@type": "WebApplication",
        name: "Vardiya",
        url: "https://zihnora.com.tr",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        inLanguage: "tr-TR",
        description:
          "Haftalık vardiya planla, ekibine WhatsApp mesajını hazırla. 45 saat, günlük 11 saat ve 11 saat dinlenme uyarıları.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "TRY",
        },
        publisher: { "@id": "https://zihnora.com.tr/#kurum" },
      },
      {
        "@type": "FAQPage",
        mainEntity: sss.map((s) => ({
          "@type": "Question",
          name: s.soru,
          acceptedAnswer: { "@type": "Answer", text: s.cevap },
        })),
      },
    ],
  };

  return (
    <main className="vitrin flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(yapisalVeri).replace(/</g, "\\u003c"),
        }}
      />

      {hesap === "silindi" ? (
        <div className="v-kap pt-6">
          <p
            role="status"
            className="rounded-md border border-[#2c3a30] bg-[#121a15] px-4 py-3 text-[13px] text-[#a8d5b5]"
          >
            Hesabın ve verilerin silindi. Yeni bir hesap açmak istersen{" "}
            <Link href="/kayit" className="underline underline-offset-2">
              buradan
            </Link>{" "}
            devam edebilirsin.
          </p>
        </div>
      ) : null}

      {/* ---------------------------------------------------------- HERO */}
      <section className="v-kap pb-14 pt-10 sm:pb-16 sm:pt-12">
        <div className="mx-auto max-w-[860px] text-center">
          {/* Marka nesnesi: gerçek WebGL sahnesi (Three.js). Sayfanın tek
              hareketli öğesi; geri kalan her şey durgun. */}
          <div className="flex justify-center">
            <LogoV boyut={132} etiket="Vardiya logosu: ışığı yansıtan üç boyutlu V" />
          </div>

          <p className="v-etiket mt-1">Vardiya yönetimi · Kafe ve restoranlar için</p>

          <h1 className="v-h1 mx-auto mt-7">
            Haftalık vardiya planı,{" "}
            <br className="hidden sm:block" />
            tek ekranda.
          </h1>

          <p className="v-p mx-auto mt-6 max-w-[54ch]">
            Personelini ekle, günleri doldur, mesajı hazırla. Excel tablosu,
            kâğıt çizelge ve WhatsApp karmaşası olmadan.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            {kullanici ? (
              <Link href="/panel" className="v-btn">
                Panele git <span aria-hidden>→</span>
              </Link>
            ) : (
              <>
                <Link href="/kayit" className="v-btn">
                  Ücretsiz başla <span aria-hidden>→</span>
                </Link>
                <Link href="/demo" className="v-btn v-btn-ghost">
                  Demoyu gör
                </Link>
              </>
            )}
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-[#7d7d86]">
            <li>Kredi kartı yok</li>
            <li aria-hidden className="hidden text-[#3a3a40] sm:block">
              ·
            </li>
            <li>Sınırsız personel</li>
            <li aria-hidden className="hidden text-[#3a3a40] sm:block">
              ·
            </li>
            <li>Türkiye&apos;de barındırılıyor</li>
          </ul>
        </div>
      </section>

      <section className="v-kap pb-20 sm:pb-24">
        <OrnekCizelge />
      </section>

      {/* ------------------------------------------------------- SEKTÖRLER */}
      <section className="border-y border-[#1c1c20]">
        <div className="v-kap flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="v-etiket">Kimler için</p>
          <p className="text-[13px] text-[#9a9aa2]">
            Kafe <span className="mx-2 text-[#3a3a40]">·</span> Restoran
            <span className="mx-2 text-[#3a3a40]">·</span> Pastane
            <span className="mx-2 text-[#3a3a40]">·</span> Bar
            <span className="mx-2 text-[#3a3a40]">·</span> Otel restoranı
            <span className="mx-2 text-[#3a3a40]">·</span> Zincir şube
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------------- ÜRÜN */}
      <section id="urun" className="v-kap scroll-mt-20 py-20 sm:py-28">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <BolumBasligi
            etiket="01 — Ürün"
            baslik="Plan, mesaj ve rapor. Aynı yerde."
            aciklama="Vardiya planlamak için gereken altı şey; fazlası değil. Her ekran aynı işi yapar: haftayı doldurmanı ve ekibin aynı planı görmesini sağlar."
          />
          <Link
            href="/demo"
            className="v-link shrink-0 self-start lg:self-end"
          >
            Demoyu kayıt olmadan aç <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="mt-12 grid border-t border-[#1c1c20] sm:grid-cols-2">
          {ozellikler.map((o, i) => (
            <div
              key={o.baslik}
              className={`border-b border-[#1c1c20] py-7 ${
                i % 2 === 0 ? "sm:pr-10" : "sm:border-l sm:border-[#1c1c20] sm:pl-10"
              }`}
            >
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-[10px] tracking-[0.18em] text-[#7d7d86]">
                  0{i + 1}
                </span>
                <h3 className="text-[15px] font-semibold tracking-tight text-[#ededf0]">
                  {o.baslik}
                </h3>
              </div>
              <p className="mt-2 pl-8 text-[13.5px] leading-relaxed text-[#8f8f98]">
                {o.metin}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- NASIL ÇALIŞIR */}
      <section id="nasil" className="border-t border-[#1c1c20]">
        <div className="v-kap scroll-mt-20 py-20 sm:py-28">
          <BolumBasligi
            etiket="02 — Nasıl çalışır"
            baslik="Üç adımda haftalık plan."
            aciklama="Kurulum yok. Hesabını açtıktan sonra ilk planını birkaç dakika içinde hazırlarsın."
          />

          <div className="mt-12 grid gap-px border-t border-[#1c1c20] sm:grid-cols-3">
            {adimlar.map((a, i) => (
              <div
                key={a.baslik}
                className="border-b border-[#1c1c20] py-8 sm:border-b-0 sm:border-l sm:border-[#1c1c20] sm:px-8 sm:first:border-l-0 sm:first:pl-0"
              >
                <span className="font-mono text-[10px] tracking-[0.18em] text-[#7d7d86]">
                  0{i + 1}
                </span>
                <h3 className="mt-3 text-base font-semibold tracking-tight text-[#ededf0]">
                  {a.baslik}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#8f8f98]">
                  {a.metin}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- SINIRLAR */}
      <section id="sinirlar" className="border-t border-[#1c1c20]">
        <div className="v-kap scroll-mt-20 py-20 sm:py-28">
          <BolumBasligi
            etiket="03 — Sınırlar"
            baslik="Neyi kontrol ediyoruz, neyi etmiyoruz?"
            aciklama="Uyarılar bilgilendirme amaçlıdır; hukuki danışmanlık değildir. Kapsamı abartmıyoruz, olmayan özelliği varmış gibi göstermiyoruz."
          />

          <div className="mt-12 grid gap-10 border-t border-[#1c1c20] pt-10 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-[#ededf0]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7fae8b]" aria-hidden />
                Kontrol edilir
              </h3>
              <ul className="mt-4 space-y-2.5">
                {kontrolEdilen.map((m) => (
                  <li
                    key={m}
                    className="flex gap-3 text-[13px] leading-relaxed text-[#9a9aa2]"
                  >
                    <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-[#3a3a40]" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-[#ededf0]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8a6a4a]" aria-hidden />
                Kapsam dışı
              </h3>
              <ul className="mt-4 space-y-2.5">
                {kapsamDisi.map((m) => (
                  <li
                    key={m}
                    className="flex gap-3 text-[13px] leading-relaxed text-[#9a9aa2]"
                  >
                    <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-[#3a3a40]" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-[#ededf0]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5c5c64]" aria-hidden />
                Henüz yok
              </h3>
              <ul className="mt-4 space-y-2.5">
                {henuzYok.map((m) => (
                  <li
                    key={m}
                    className="flex gap-3 text-[13px] leading-relaxed text-[#9a9aa2]"
                  >
                    <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-[#3a3a40]" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-[#1c1c20] pt-6">
            <p className="max-w-[76ch] text-[12px] leading-relaxed text-[#85858e]">
              <strong className="font-medium text-[#9a9aa2]">Sorumluluk notu:</strong>{" "}
              Vardiya bir planlama ve hatırlatma aracıdır. Mevzuatın işletmene nasıl
              uygulanacağından ve nihai plandan işveren sorumludur. Şüpheli durumlarda
              iş hukuku uzmanına veya mali müşavire danış.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- GİZLİLİK */}
      <section className="border-t border-[#1c1c20]">
        <div className="v-kap py-14">
          <div className="grid gap-8 lg:grid-cols-[200px_1fr] lg:gap-12">
            <p className="v-etiket">Gizlilik</p>
            <div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { b: "Hesaba kilitli", m: "Başka bir hesap senin verini göremez." },
                  { b: "Ücret istenmez", m: "Maaş ve maliyet bilgisi toplanmaz." },
                  { b: "Yurt içinde", m: "Veriler Türkiye'deki sunucuda tutulur." },
                  { b: "Reklamsız", m: "Üçüncü taraf takip betiği yok." },
                ].map((k) => (
                  <div key={k.b}>
                    <p className="text-[13px] font-semibold text-[#ededf0]">{k.b}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-[#8f8f98]">
                      {k.m}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-x-8 gap-y-2">
                <Link href="/gizlilik" className="v-link">
                  Gizlilik ve KVKK aydınlatması <span aria-hidden>→</span>
                </Link>
                <Link href="/personel-aydinlatma" className="v-link">
                  Personel aydınlatma örneği <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ FİYAT */}
      <section id="fiyat" className="border-t border-[#1c1c20]">
        <div className="v-kap scroll-mt-20 py-20 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div>
              <p className="v-etiket">04 — Fiyat</p>
              <p className="v-h1 mt-6 !text-[clamp(4rem,9vw,7rem)]">₺0</p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#85858e]">
                aylık · sınırsız personel
              </p>
            </div>

            <div className="max-w-[46ch]">
              <h2 className="v-h2">Tek plan. Tamamen ücretsiz.</h2>
              <p className="v-p mt-4">
                Sınırsız personel, sınırsız vardiya şablonu ve bugünkü tüm
                özellikler ücretsiz. Kredi kartı, abonelik veya deneme süresi yok.
              </p>

              <ul className="mt-6 space-y-2 text-[13px] text-[#9a9aa2]">
                {[
                  "Sınırsız personel ve haftalık plan",
                  "Excel / CSV içe aktarma",
                  "WhatsApp'a hazır mesaj ve personele özel link",
                  "Aylık rapor, CSV indirme, veri indirme ve hesap silme",
                ].map((m) => (
                  <li key={m} className="flex gap-3">
                    <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-[#3a3a40]" />
                    {m}
                  </li>
                ))}
              </ul>

              <Link href={kullanici ? "/panel" : "/kayit"} className="v-btn mt-8">
                {kullanici ? "Panele git" : "Ücretsiz başla"} <span aria-hidden>→</span>
              </Link>

              <p className="mt-6 border-t border-[#1c1c20] pt-5 text-[12px] leading-relaxed text-[#85858e]">
                <strong className="font-medium text-[#9a9aa2]">Fiyat taahhüdü:</strong>{" "}
                Hizmet ücretli olmadan 1 ay önce bilgilendirme yapılır. Asla kart
                bilgilerin istenmez; bu süreçte dilediğin gibi ücretsiz kullanırsın.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- SSS */}
      <section id="sss" className="border-t border-[#1c1c20]">
        <div className="v-kap grid scroll-mt-20 gap-10 py-20 sm:py-28 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <BolumBasligi
            etiket="05 — SSS"
            baslik="Sık sorulan sorular"
          />

          <div className="border-t border-[#1c1c20]">
            {sss.map((s) => (
              <details key={s.soru} className="group border-b border-[#1c1c20]">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[14px] font-medium text-[#e4e4e8] [&::-webkit-details-marker]:hidden">
                  {s.soru}
                  <span
                    className="mt-0.5 shrink-0 font-mono text-base leading-none text-[#7d7d86] transition-transform duration-200 group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="pb-5 pr-10 text-[13px] leading-relaxed text-[#8f8f98]">
                  {s.cevap}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- CTA */}
      <section className="border-t border-[#1c1c20]">
        <div className="v-kap py-24 text-center sm:py-32">
          <Marka nokta={false} boyut={26} className="justify-center text-[#3f3f46]" />
          <h2 className="v-h1 mx-auto mt-8 max-w-[18ch] !text-[clamp(2.2rem,5vw,3.8rem)]">
            Hazırsanız başlayalım.
          </h2>
          <p className="v-p mx-auto mt-5 max-w-[46ch]">
            Kurulum yok. E-posta ve şifreyle hesabını aç; ilk planını birkaç
            dakikada hazırla.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            {kullanici ? (
              <Link href="/panel" className="v-btn">
                Panele git <span aria-hidden>→</span>
              </Link>
            ) : (
              <>
                <Link href="/kayit" className="v-btn">
                  Ücretsiz başla <span aria-hidden>→</span>
                </Link>
                <Link href="/giris" className="v-btn v-btn-ghost">
                  Giriş yap
                </Link>
              </>
            )}
          </div>

          <p className="mt-10 text-[12px] text-[#85858e]">
            Kurulumda takılırsan{" "}
            <a
              href="mailto:destek@zihnora.com.tr"
              className="text-[#9a9aa2] underline underline-offset-4 hover:text-[#ededf0]"
            >
              destek@zihnora.com.tr
            </a>{" "}
            ·{" "}
            <a
              href="mailto:hmum117413@gmail.com"
              className="text-[#9a9aa2] underline underline-offset-4 hover:text-[#ededf0]"
            >
              hmum117413@gmail.com
            </a>
          </p>
          <p className="mt-3 text-[11.5px] text-[#7d7d86]">
            Vardiya 18 Ekim 2026&apos;da yayına girdi. Uydurma yorum veya logo
            yayınlamıyoruz; ilk pilotların izinli geri bildirimleri burada yer
            alacak.{" "}
            <Link href="/hakkimizda" className="underline underline-offset-4">
              Hakkımızda
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
