import Link from "next/link";
import type { Metadata } from "next";
import TamEkran from "@/components/TamEkran";
import { kaydetZiyaret } from "@/lib/visits";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const istatistikler = [
  { deger: "5 dk", etiket: "Haftalık plan" },
  { deger: "45 saat", etiket: "Mevzuat uyarısı" },
  { deger: "11 saat", etiket: "Dinlenme kontrolü" },
  { deger: "₺0", etiket: "Sınırsız kullanım" },
];

const guvenceler = [
  "KVKK uyumlu",
  "Reklamsız",
  "Türkiye'de barındırılıyor",
  "Kredi kartı yok",
];

const sorunlar = [
  {
    baslik: "Son sürüm kimde?",
    metin:
      "Plan Excel'de hazırlanıyor, değişiklikler WhatsApp'ta onlarca mesaja bölünüyor. Kimse hangi versiyonun güncel olduğunu bilmiyor.",
  },
  {
    baslik: "Kim hangi gün çalışıyor?",
    metin:
      "Personel her hafta aynı soruyu soruyor. İşletme sahibi de aynı cevabı tekrar tekrar yazıyor.",
  },
  {
    baslik: "45 saat aşıldı mı?",
    metin:
      "Haftalık sınır ve dinlenme süreleri elle kontrol ediliyor. Gözden kaçan bir gün, işletmeyi riske atıyor.",
  },
];

const ozellikler = [
  {
    baslik: "Haftalık plan ızgarası",
    metin:
      "Personel × gün tablosunda her hücreye tıklayıp vardiya seç. Sürükleme, formül ve sekme yok.",
    yol: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  },
  {
    baslik: "Tek tıkla WhatsApp",
    metin:
      "Her personele kendi haftalık programı hazırlanır; tek tıkla WhatsApp'ta açılır.",
    yol: "M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z",
  },
  {
    baslik: "Mevzuat uyarıları",
    metin:
      "45 saat, 11 saat dinlenme ve resmî tatil kontrolleri plan yaparken görünür.",
    yol: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  },
  {
    baslik: "Personele özel link",
    metin:
      "Çalışan, giriş yapmadan kendi programını görür. Uygulama indirmesi veya hesap açması gerekmez.",
    yol: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  },
  {
    baslik: "Aylık rapor & CSV",
    metin:
      "Kim kaç gün, kaç saat çalıştı? Aylık özeti görüntüle, Excel'e tek tıkla indir.",
    yol: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  },
  {
    baslik: "Yazdırılabilir çizelge",
    metin:
      "Duvara asılacak haftalık çizelgeyi tek tıkla yazdır. Kâğıt ve kalemle uğraşma.",
    yol: "M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z",
  },
];

const adimlar = [
  {
    baslik: "Personelini ekle",
    metin:
      "Tek tek ya da listeden yapıştırarak. Ad, görev ve telefon yeterli.",
  },
  {
    baslik: "Haftayı doldur",
    metin:
      "Hazır şablonlardan seç. 45 saati aşanı ve dinlenmesi yetersiz olanı anında gör.",
  },
  {
    baslik: "WhatsApp'tan gönder",
    metin:
      "Herkes kendi programını alır. Personel giriş yapmadan, telefondan görür.",
  },
];

const nedenler = [
  {
    baslik: "Sade arayüz",
    metin: "Kullanılmayan özellik yok. Açtığın anda planlamaya başlarsın.",
  },
  {
    baslik: "Mevzuata saygı",
    metin: "45 saat, 11 saat dinlenme ve resmî tatil uyarıları yerleşik.",
  },
  {
    baslik: "Gizlilik odaklı",
    metin: "Ücret bilgisi istenmez; her işletme yalnızca kendi verisini görür.",
  },
  {
    baslik: "Gerçekten ücretsiz",
    metin: "Kredi kartı, abonelik, deneme süresi veya reklam yok.",
  },
  {
    baslik: "Türkçe destek",
    metin: "Ürün de destek de Türkçe. Anlamadığın bir terim kalmaz.",
  },
  {
    baslik: "Hızlı kurulum",
    metin: "Kurulum yok. Kayıt ol, personelini ekle, planı hazırla.",
  },
];

const sektorler = [
  { ad: "Kafe", alt: "Barista & servis", ikon: "☕" },
  { ad: "Restoran", alt: "Mutfak & salon", ikon: "🍽️" },
  { ad: "Pastane", alt: "Üretim & tezgâh", ikon: "🥐" },
  { ad: "Bar", alt: "Gece vardiyası", ikon: "🍸" },
  { ad: "Otel restoranı", alt: "Vardiyalı ekip", ikon: "🏨" },
  { ad: "Zincir şube", alt: "Çoklu lokasyon", ikon: "🧾" },
];

const sss = [
  {
    soru: "Vardiya gerçekten ücretsiz mi?",
    cevap:
      "Evet. Sınırsız personel, sınırsız şablon ve tüm özellikler ücretsiz. Kredi kartı, abonelik veya deneme süresi yok.",
  },
  {
    soru: "Personel uygulama indirmek zorunda mı?",
    cevap:
      "Hayır. Her personele kişisel bir bağlantı verirsin; tarayıcıdan kendi haftalık programını görür.",
  },
  {
    soru: "Verilerim nerede saklanıyor?",
    cevap:
      "Türkiye'deki sunucuda, işletmeye özel veritabanında. Ücret bilgisi istenmez ve saklanmaz; dilediğin an verini indirip hesabını silebilirsin.",
  },
  {
    soru: "45 saat ve 11 saat uyarıları ne işe yarar?",
    cevap:
      "Plan yaparken haftalık 45 saat sınırını ve iki vardiya arası en az 11 saat dinlenmeyi gösterir. Amaç, gözden kaçan bir günü önlemek.",
  },
  {
    soru: "Kaç personel ekleyebilirim?",
    cevap:
      "Sınır yok. Küçük bir kafeden çok şubeli bir işletmeye kadar aynı hesapla kullanabilirsin.",
  },
];

function BolumBasligi({
  etiket,
  baslik,
  aciklama,
  ortala = false,
}: {
  etiket: string;
  baslik: string;
  aciklama?: string;
  ortala?: boolean;
}) {
  return (
    <div className={ortala ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
        {etiket}
      </p>
      <h2 className="mt-3 text-3xl font-extrabold leading-[1.08] tracking-[-0.04em] text-zinc-900 sm:text-4xl">
        {baslik}
      </h2>
      {aciklama ? (
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">{aciklama}</p>
      ) : null}
    </div>
  );
}

/** Ürünü gösteren mini çizelge — tarayıcı penceresi içinde (etkileşimsiz). */
function OrnekCizelge() {
  const gunler = ["Pzt", "Sal", "Çar", "Per", "Cum"];
  const satirlar = [
    { ad: "Ayşe Y.", renk: "bg-amber-500", vardiyalar: ["Sabah", "Sabah", "—", "Sabah", "—"] },
    { ad: "Mehmet K.", renk: "bg-emerald-500", vardiyalar: ["Akşam", "Akşam", "Akşam", "—", "—"] },
    { ad: "Zeynep D.", renk: "bg-rose-500", vardiyalar: ["—", "—", "Tam gün", "—", "Sabah"] },
    { ad: "Can A.", renk: "bg-violet-500", vardiyalar: ["—", "—", "—", "Akşam", "Akşam"] },
  ];

  return (
    <div className="relative">
      <div
        className="amber-glow absolute -inset-8 -z-10 rounded-[3rem] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="kart overflow-hidden rounded-[24px] shadow-[0_24px_70px_-30px_rgba(20,24,27,0.35)]"
        role="img"
        aria-label="Örnek haftalık vardiya planı: 4 personel, 5 gün, 14 vardiya ve mevzuata uygun rozeti."
      >
        <div aria-hidden="true">
          <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50/80 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-medium text-zinc-500">
              zihnora.com.tr/panel
            </span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-semibold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> canlı
            </span>
          </div>

          <div className="px-4 pb-3 pt-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[13px] font-bold text-zinc-900">Haftalık plan</div>
                <div className="text-[11px] text-zinc-500">19 – 25 Ekim</div>
              </div>
              <span className="cip !px-2 !py-0.5 !text-[10px]">4 kişi</span>
            </div>

            <div className="mt-3 grid grid-cols-[62px_repeat(5,minmax(0,1fr))] gap-1 text-[10px]">
              <div />
              {gunler.map((g) => (
                <div key={g} className="pb-1 text-center font-semibold text-zinc-500">
                  {g}
                </div>
              ))}
              {satirlar.map((s) => (
                <div key={s.ad} className="contents">
                  <div className="flex min-w-0 items-center gap-1.5 py-1.5 text-[10px] font-semibold text-zinc-700">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.renk}`} />
                    <span className="truncate">{s.ad}</span>
                  </div>
                  {s.vardiyalar.map((v, i) => (
                    <div
                      key={i}
                      className={`my-0.5 truncate rounded-md border px-1 py-1 text-center text-[9px] font-medium ${
                        v === "—"
                          ? "border-dashed border-zinc-200 text-zinc-400"
                          : v === "Sabah"
                            ? "border-amber-200 bg-amber-100 text-amber-900"
                            : v === "Akşam"
                              ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                              : v === "Tam gün"
                                ? "border-rose-200 bg-rose-100 text-rose-800"
                                : "border-violet-200 bg-violet-100 text-violet-800"
                      }`}
                    >
                      {v}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 text-[10px] text-zinc-500">
              <span>Toplam 14 vardiya</span>
              <span className="font-semibold text-emerald-700">✓ Mevzuata uygun</span>
            </div>
          </div>
        </div>
      </div>

      <div className="suzul absolute -bottom-5 -left-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-xl sm:-left-6">
        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Bu hafta çalışan
        </div>
        <div className="mt-0.5 text-lg font-extrabold tracking-tight text-zinc-900">
          3 / 5 kişi
        </div>
      </div>
      <div
        className="suzul absolute -right-3 -top-4 hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-800 sm:block"
        style={{ animationDelay: "1.2s" }}
      >
        5 dakikada hazır
      </div>
    </div>
  );
}

export default async function Home() {
  await kaydetZiyaret();

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
          "Kafe ve restoranlar için Türkçe, mevzuata uygun haftalık vardiya yönetimi.",
      },
      {
        "@type": "WebApplication",
        name: "Vardiya",
        url: "https://zihnora.com.tr",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        inLanguage: "tr-TR",
        description:
          "5 dakikada haftalık vardiya planla, ekibine WhatsApp'tan gönder. 45 saat ve 11 saat dinlenme uyarıları.",
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
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(yapisalVeri).replace(/</g, "\\u003c"),
        }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-grid absolute inset-0 -z-10" aria-hidden="true" />
        <div
          className="amber-glow absolute -right-32 -top-40 -z-10 h-[520px] w-[520px] blur-3xl"
          aria-hidden="true"
        />
        <div className="kap grid min-h-[calc(100svh-3.5rem)] items-center gap-12 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.03fr_0.97fr] lg:gap-10 lg:pb-24">
          <div className="hero-gel">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Kafe &amp; restoranlar için
            </span>
            <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.045em] text-zinc-900 sm:text-6xl">
              Haftalık vardiya planı,{" "}
              <span className="relative whitespace-nowrap text-amber-600">
                5 dakikada
                <span
                  className="absolute inset-x-0 -bottom-1 -z-10 h-2.5 rounded-full bg-amber-200/70"
                  aria-hidden="true"
                />
              </span>{" "}
              hazır.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-600 sm:text-lg">
              Personelini ekle, günleri doldur, tek tıkla WhatsApp&apos;tan gönder.
              Excel, kâğıt ve mesaj karmaşası olmadan.
            </p>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <Link href="/kayit" className="btn-cta h-12 px-7">
                Ücretsiz hesap aç <span aria-hidden>→</span>
              </Link>
              <Link href="/giris" className="btn-ghost h-12 px-7">
                Giriş yap
              </Link>
              <TamEkran className="btn-ghost h-12 px-5" />
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-zinc-600">
              {["Kredi kartı yok", "Türkçe & mevzuata uygun", "Türkiye'de barındırılıyor"].map(
                (m) => (
                  <li key={m} className="flex items-center gap-1.5">
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-100 text-[9px] text-emerald-700">
                      ✓
                    </span>
                    {m}
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="hero-gel hero-gel-2">
            <OrnekCizelge />
          </div>
        </div>
      </section>

      {/* İstatistik + güvence bandı */}
      <section className="bolum-gri">
        <div className="kap py-8 sm:py-10" data-reveal>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {istatistikler.map((s) => (
              <div key={s.etiket}>
                <div className="text-3xl font-extrabold tracking-tight text-zinc-900">
                  {s.deger}
                </div>
                <div className="mt-1 text-xs font-medium text-zinc-500">{s.etiket}</div>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap gap-2 border-t border-zinc-200/80 pt-5">
            {guvenceler.map((g) => (
              <span key={g} className="cip">
                <span className="text-emerald-600">✓</span> {g}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Sorun */}
      <section className="kap py-16 sm:py-24" data-reveal>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <BolumBasligi
              etiket="Sorun"
              baslik="Plan Excel'de başlıyor, WhatsApp'ta kayboluyor."
              aciklama="Çoğu işletme vardiya planını bir tabloda kuruyor; ama plan ekip içinde dağıldığı anda görünmez oluyor. Vardiya, bu üç sorunu tek ekranda çözüyor."
            />
            <Link
              href="#ozellikler"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 underline-offset-4 hover:underline"
            >
              Çözümü gör <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {sorunlar.map((s, i) => (
              <div key={s.baslik} className="kart p-5">
                <span className="text-[11px] font-bold tracking-[0.18em] text-amber-700">
                  0{i + 1}
                </span>
                <h3 className="mt-3 text-[15px] font-bold text-zinc-900">{s.baslik}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">{s.metin}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section id="ozellikler" className="bolum-gri scroll-mt-20">
        <div className="kap py-16 sm:py-24" data-reveal>
          <BolumBasligi
            etiket="Özellikler"
            baslik="İhtiyacın olan her şey, fazlası değil."
            aciklama="Vardiya planlamak için gereken altı şey; tek ekranda, birbirine bağlı ve sade."
            ortala
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ozellikler.map((o) => (
              <div
                key={o.baslik}
                className="kart group p-6 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_16px_40px_-24px_rgba(20,24,27,0.35)]"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-5 w-5"
                    aria-hidden
                  >
                    <path d={o.yol} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <h3 className="mt-4 text-[15px] font-bold text-zinc-900">{o.baslik}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">{o.metin}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section id="nasil" className="kap scroll-mt-20 py-16 sm:py-24" data-reveal>
        <BolumBasligi
          etiket="Nasıl çalışır"
          baslik="Üç adımda haftalık plan."
          aciklama="Kurulum yok. Kayıt olduktan sonra ilk planını birkaç dakika içinde hazırlarsın."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {adimlar.map((a, i) => (
            <div key={a.baslik} className="kart relative p-6">
              <span className="text-[11px] font-bold tracking-[0.2em] text-amber-700">
                0{i + 1}
              </span>
              <h3 className="mt-3 text-lg font-bold text-zinc-900">{a.baslik}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-600">{a.metin}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Neden Vardiya */}
      <section className="bolum-gri">
        <div className="kap py-16 sm:py-24" data-reveal>
          <BolumBasligi
            etiket="Neden Vardiya"
            baslik="Vitrin değil, işini kolaylaştıran bir araç."
            aciklama="Yeni özellik eklemeden önce tek bir soruyu soruyoruz: Bu, işletmenin işini gerçekten kolaylaştırıyor mu?"
          />
          <div className="kart mt-10 grid gap-x-10 gap-y-7 p-7 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
            {nedenler.map((n) => (
              <div key={n.baslik} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                  ✓
                </span>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">{n.baslik}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-zinc-600">{n.metin}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kimler için */}
      <section className="kap py-16 sm:py-24" data-reveal>
        <BolumBasligi
          etiket="Kimler için"
          baslik="Kafe, restoran ve pastaneler için tasarlandı."
          aciklama="Personel sayısı 5 ile 30 arasında olan işletmeler için ideal. Çok şubeli yapılarda da aynı hesap yeterli."
          ortala
        />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {sektorler.map((s) => (
            <div
              key={s.ad}
              className="kart p-4 text-center transition-colors hover:border-amber-300"
            >
              <div className="text-2xl" aria-hidden>
                {s.ikon}
              </div>
              <div className="mt-2 text-sm font-bold text-zinc-900">{s.ad}</div>
              <div className="mt-0.5 text-[11px] text-zinc-500">{s.alt}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Gizlilik */}
      <section className="bolum-gri">
        <div className="kap grid gap-8 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16" data-reveal>
          <div>
            <BolumBasligi
              etiket="Gizlilik"
              baslik="Verin senin. Reklam yok, takip yok."
              aciklama="Ücret bilgisi istenmez; üçüncü taraf analitik betiği kullanılmaz. Her işletmenin verisi kendi hesabına kilitlidir."
            />
            <Link
              href="/gizlilik"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 underline-offset-4 hover:underline"
            >
              Gizlilik ve KVKK aydınlatması <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { b: "Hesaba kilitli", m: "Başka bir hesap senin verini göremez." },
              { b: "Ücret istenmez", m: "Maaş ve maliyet bilgisi toplanmaz." },
              { b: "Yurt içinde", m: "Veriler Türkiye'deki sunucuda tutulur." },
            ].map((k) => (
              <div key={k.b} className="kart p-4">
                <div className="text-sm font-bold text-zinc-900">{k.b}</div>
                <div className="mt-1 text-[12px] leading-relaxed text-zinc-600">{k.m}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kurucu */}
      <section className="kap pt-14" data-reveal>
        <div className="kart flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-7">
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-700 text-lg font-bold tracking-tight text-white"
            aria-hidden="true"
          >
            HM
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              Kurucu
            </p>
            <h2 className="mt-0.5 text-lg font-bold tracking-tight text-zinc-900">
              Hasan Mum{" "}
              <span className="font-medium text-zinc-500">
                · Kurucu &amp; Geliştirici
              </span>
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600">
              Vardiya&apos;yı, kafe ve restoran sektöründe çalışırken gördüğü
              planlama karmaşasını çözmek için geliştirdi. Ürün hâlâ tek bir
              soruyla şekilleniyor: &quot;Bu, işletmenin işini gerçekten
              kolaylaştırıyor mu?&quot;
            </p>
          </div>
          <Link href="/hakkimizda" className="btn-ghost h-10 shrink-0 px-5 text-[13px]">
            Hakkımızda <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* Fiyatlandırma */}
      <section className="kap py-16 sm:py-24" data-reveal>
        <BolumBasligi
          etiket="Fiyatlandırma"
          baslik="Tek plan: tamamen ücretsiz."
          aciklama="Küçük işletmenin profesyonel bir vardiya düzenine erişmesi için aylık ücret olmamalı."
          ortala
        />
        <div className="mx-auto mt-10 max-w-2xl rounded-[24px] border-2 border-amber-500 bg-white p-7 shadow-[0_24px_60px_-30px_rgba(245,158,11,0.45)]">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
                Vardiya
              </div>
              <div className="mt-1 text-4xl font-extrabold tracking-tight text-zinc-900">
                ₺0
                <span className="text-base font-medium text-zinc-500"> / ay</span>
              </div>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">
              Sınırsız
            </span>
          </div>

          <ul className="mt-5 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
            {[
              "Sınırsız personel",
              "Sınırsız vardiya şablonu",
              "WhatsApp ile gönderim",
              "Personele özel link",
              "Aylık rapor & CSV",
              "Veri indirme & hesap silme",
            ].map((m) => (
              <li key={m} className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> {m}
              </li>
            ))}
          </ul>

          <Link href="/kayit" className="btn-cta mt-6 h-12 w-full">
            Ücretsiz başla <span aria-hidden>→</span>
          </Link>
          <p className="mt-3 text-center text-xs text-zinc-500">
            Kredi kartı yok · abonelik yok · deneme süresi yok
          </p>
        </div>
      </section>

      {/* SSS */}
      <section id="sss" className="bolum-gri scroll-mt-20">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24" data-reveal>
          <BolumBasligi etiket="SSS" baslik="Sık sorulan sorular" ortala />
          <div className="mt-8 space-y-3">
            {sss.map((s) => (
              <details
                key={s.soru}
                className="kart group px-5 py-4"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-zinc-900 [&::-webkit-details-marker]:hidden">
                  {s.soru}
                  <span
                    className="text-lg font-medium text-amber-700 transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-600">{s.cevap}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Son çağrı */}
      <section className="kap py-16 sm:py-24" data-reveal>
        <div className="relative overflow-hidden rounded-[28px] bg-zinc-950 px-6 py-10 sm:px-10 sm:py-14">
          <div
            className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-amber-500/30 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="max-w-xl text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
                Bu haftanın planı 5 dakika sonra hazır.
              </h2>
              <p className="mt-2 text-sm text-zinc-300">
                Kredi kartı, abonelik veya kurulum yok. Sadece e-posta ve şifre.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/kayit" className="btn-cta h-12 px-6">
                Ücretsiz başla <span aria-hidden>→</span>
              </Link>
              <Link
                href="/giris"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Giriş
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
