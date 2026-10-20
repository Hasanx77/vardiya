import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { aktifKullanici } from "@/lib/auth";
import { demoOzet } from "@/lib/demo-data";
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
  "KVKK aydınlatması",
  "Veri indir / sil",
  "Reklamsız",
  "Türkiye'de barındırılıyor",
  "Kredi kartı yok",
  "Demo kayıt istemez",
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
    baslik: "Excel / CSV içe aktarma",
    metin:
      "Mevcut personel listesini Excel'den kopyalayıp yapıştır veya CSV yükle. Başlık satırı otomatik atlanır.",
    yol: "M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
  },
  {
    baslik: "WhatsApp'a hazır mesaj",
    metin:
      "Her personele kendi haftalık programı hazırlanır; mesajı tek tıkla WhatsApp'ta açarsın. Toplu otomatik gönderim yoktur.",
    yol: "M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z",
  },
  {
    baslik: "Süre uyarıları",
    metin:
      "45 saat, 11 saat dinlenme, gece ve resmî tatil kontrolleri plan yaparken görünür. Kapsamı sınırlıdır; aşağıda yazıyor.",
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
      "Tek tek, Excel'den kopyalayıp yapıştırarak veya CSV yükleyerek. Ad, görev ve telefon yeterli.",
  },
  {
    baslik: "Haftayı doldur",
    metin:
      "Hazır şablonlardan seç. 45 saati aşanı ve dinlenmesi yetersiz olanı anında gör.",
  },
  {
    baslik: "WhatsApp mesajını hazırla",
    metin:
      "Her personel kendi programını alır; mesajı tek tıkla WhatsApp'ta açarsın. Personel giriş yapmadan telefondan görür.",
  },
];

const nedenler = [
  {
    baslik: "Sade arayüz",
    metin: "Kullanılmayan özellik yok. Açtığın anda planlamaya başlarsın.",
  },
  {
    baslik: "Süre kontrolü",
    metin:
      "45 saat, 11 saat dinlenme, gece ve resmî tatil uyarıları yerleşik. Hukuki denetim değildir.",
  },
  {
    baslik: "Gizlilik odaklı",
    metin: "Ücret bilgisi istenmez; her işletme yalnızca kendi verisini görür.",
  },
  {
    baslik: "Gerçekten ücretsiz",
    metin:
      "Bugünkü temel özellikler kalıcı olarak ücretsiz; ileri özellikler ileride Pro olabilir. Kredi kartı, abonelik veya deneme süresi yok.",
  },
  {
    baslik: "Türkçe destek",
    metin:
      "Ürün de destek de Türkçe. destek@zihnora.com.tr adresine yaz, genellikle aynı iş günü dönüş yapıyoruz.",
  },
  {
    baslik: "Hızlı kurulum",
    metin: "Kurulum yok. Kayıt ol, personelini ekle, planı hazırla.",
  },
];

const karsilastirma = [
  {
    ozellik: "Haftalık planı hazırlama",
    excel: "Formül, renk ve hücre elle kurulur",
    kagit: "Elle yazılır, silinince kaybolur",
    vardiya: "Hücreye tıkla; plan 5 dakikada hazır",
  },
  {
    ozellik: "45 saat ve 11 saat kontrolü",
    excel: "Formülü sen kurmalısın",
    kagit: "Gözle kontrol",
    vardiya: "Plan yaparken otomatik uyarı",
  },
  {
    ozellik: "Personele ulaştırma",
    excel: "WhatsApp'a elle kopyalanır",
    kagit: "Panoya asılır",
    vardiya: "Kişiye hazır mesaj + kişisel link",
  },
  {
    ozellik: "Güncel sürüm",
    excel: "Dosya kopyaları karışır",
    kagit: "Tek nüsha, kaybolabilir",
    vardiya: "Tek kaynak; herkes son hâli görür",
  },
  {
    ozellik: "Personel kendi programını görür",
    excel: "Hayır",
    kagit: "Yalnızca panoda",
    vardiya: "Giriş yapmadan, kendi linkinden",
  },
  {
    ozellik: "Aylık rapor",
    excel: "Elle hesaplanır",
    kagit: "Yok",
    vardiya: "Aylık özet + CSV indirme",
  },
  {
    ozellik: "Kurulum",
    excel: "Şablonu sen kurarsın",
    kagit: "Kalem ve kâğıt",
    vardiya: "Kayıt + 3 adım",
  },
  {
    ozellik: "Ücret",
    excel: "Excel lisansı",
    kagit: "Ücretsiz",
    vardiya: "₺0 · kredi kartı yok",
  },
];

const sektorler = [
  {
    ad: "Kafe",
    alt: "Barista & servis",
    yollar: [
      "M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z",
      "M16 9h1.5a2.5 2.5 0 0 1 0 5H16",
      "M6 3v2M10 3v2M14 3v2",
    ],
  },
  {
    ad: "Restoran",
    alt: "Mutfak & salon",
    yollar: ["M4 17h16", "M6 17a6 6 0 0 1 12 0", "M12 8v3"],
  },
  {
    ad: "Pastane",
    alt: "Üretim & tezgâh",
    yollar: [
      "M5 12a7 7 0 0 1 14 0v4a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-4Z",
      "M9 9v2M12 8v3M15 9v2",
    ],
  },
  {
    ad: "Bar",
    alt: "Gece vardiyası",
    yollar: ["M4 4h16l-8 9v7", "M8 20h8", "M7 9h10"],
  },
  {
    ad: "Otel restoranı",
    alt: "Vardiyalı ekip",
    yollar: [
      "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",
      "M16 9h2a2 2 0 0 1 2 2v10",
      "M8 7h2M8 11h2M8 15h2M12 7h2M12 11h2M12 15h2",
      "M3 21h18",
    ],
  },
  {
    ad: "Zincir şube",
    alt: "Çoklu lokasyon · yol haritasında",
    yollar: ["M12 3 3 8l9 5 9-5-9-5Z", "M3 12l9 5 9-5", "M3 16l9 5 9-5"],
  },
];

const sss = [
  {
    soru: "Vardiya gerçekten ücretsiz mi?",
    cevap:
      "Evet. Sınırsız personel, sınırsız şablon ve bugünkü tüm özellikler ücretsiz. Kredi kartı, abonelik veya deneme süresi yok.",
  },
  {
    soru: "Marka Vardiya ama adres neden zihnora.com.tr?",
    cevap:
      "Vardiya ürünün adı; zihnora.com.tr ise yayın adresimiz (Zihnora'nın ürünü). İleride vardiya.app adresine taşımayı planlıyoruz; bu adres de çalışmaya devam edecek. İki isim aynı ürünü gösterir, farklı bir şirket veya kopya site yok.",
  },
  {
    soru: "Bu iş nasıl ayakta kalacak? Bir yıl sonra kapanır mı?",
    cevap:
      "Bugünkü temel özellikler (personel, haftalık plan, rapor, personele özel link) kalıcı olarak ücretsiz kalacak. İleride şube yönetimi veya otomatik bildirim gibi ileri özellikler ücretli bir Pro plana dönüşebilir; bugün kullandığın temel özellikler ücretli hâle gelmeyecek. Ücretli bir özellik eklenirse en az 30 gün önce haber verilir, kart bilgisi istenmez. Tek kişilik bir proje olduğu için kapanma riskini de saklamıyoruz: hizmet sona ererse verini Profil → Verilerimi indir ile JSON olarak dışa aktarabilirsin.",
  },
  {
    soru: "Personel uygulama indirmek zorunda mı? Telefona kurulabiliyor mu?",
    cevap:
      "Hayır. Personel kişisel bağlantıyı tarayıcıdan açar; uygulama mağazası veya hesap gerekmez. Sen de siteyi telefondan kullanabilirsin; tarayıcı menüsünden 'Ana Ekrana Ekle' ile uygulama gibi açılır (PWA). Mağazada indirilecek bir uygulama yok.",
  },
  {
    soru: "Kayıt olmadan ürünü görebilir miyim?",
    cevap:
      "Evet. /demo adresinde örnek bir işletmenin haftalık planını açabilir, hücrelere tıklayarak vardiya değiştirebilir ve uyarıları canlı görebilirsin. Demo hiçbir veri kaydetmez.",
  },
  {
    soru: "Verilerim nerede saklanıyor? Veri sorumlusu kim?",
    cevap:
      "Veriler Türkiye'deki sunucuda, işletmeye özel veritabanında tutulur. Personel verileri için veri sorumlusu işletme (sen), Vardiya ise veri işleyen konumundadır. Ücret bilgisi istenmez ve saklanmaz. Personeline verilecek örnek aydınlatma metni /personel-aydinlatma sayfasında; verini dilediğin an profil sayfasından indirebilir, hesabını silebilirsin.",
  },
  {
    soru: "45 saat ve 11 saat uyarıları tam olarak neyi kontrol ediyor?",
    cevap:
      "Kontrol edilenler: haftalık 45 saat (İş Kanunu 4857 m.63), iki vardiya arası en az 11 saat dinlenme (m.69), aynı gün çift vardiya çakışması, gece çalışmasında 7,5 saat (m.69) ve resmî tatil günleri (2429 sayılı Kanun). Kapsam dışı: haftalık 24 saat kesintisiz hafta tatili, fazla mesai ücreti/puantaj/bordro, yıllık izin kullanımı ve bakiye düşümü, iş sözleşmesi veya sektörel istisnalar. Bu uyarılar hukuki danışmanlık değildir; nihai plandan işveren sorumludur. Ayrıntılı liste sayfadaki 'Mevzuat kapsamı' bölümünde.",
  },
  {
    soru: "Excel listemi yükleyebilir miyim?",
    cevap:
      "Evet. Personel listesini Excel'den olduğu gibi kopyalayıp yapıştırabilirsin; ekran görüntüsü değil, hücreleri seçip kopyaladığında sütunlar korunur. Alternatif olarak .csv, .tsv veya .txt dosyası yükleyebilirsin. Başlık satırı otomatik atlanır.",
  },
  {
    soru: "Çok şubeli işletmeler için şube ve müdür yetkisi var mı?",
    cevap:
      "Henüz yok. Bugün tek işletme ve tek yönetici hesabıyla çalışıyor; her şube kendi hesabıyla kullanabilir. Tek panelden şube yönetimi ile 'müdür yalnız kendi şubesini görsün' yetkisi yol haritasında ve hazır olduğunda duyurulacak.",
  },
  {
    soru: "Vardiya değişimi, izin ve bildirim nasıl işliyor?",
    cevap:
      "Şu an uygulama içi talep akışı, okundu/onay bilgisi ve otomatik bildirim yok. Personel değişiklik veya izin talebini sana WhatsApp'tan iletir; sen panelde hücreyi değiştirip güncel mesajı gönderirsin. Personel linki her zaman son hâli gösterir. İzin gününü boş bırakırsın; yıllık izin hakkı profilde görünür ama bakiye otomatik düşmez. Bu adımlar yol haritasında.",
  },
  {
    soru: "15 kişilik ekipte WhatsApp'a 15 kez mi tıklayacağım?",
    cevap:
      "Evet, şu an her personele ayrı mesaj hazırlanır ve ayrı ayrı açılır. Tek mesajla gruba veya herkese otomatik gönderim yoktur; WhatsApp Business API entegrasyonu da yoktur. Personel linki sayesinde çalışan programını kendi açar; yine de dağıtım sorumluluğu sende. Toplu gönderim yol haritasında.",
  },
  {
    soru: "Personel linkini bilen herkes görebilir mi? Link iptal edilebiliyor mu?",
    cevap:
      "Link, personelin benzersiz kimliğini içerir; tahmin edilmesi zordur ama linki ele geçiren veya yönlendiren herkes programı görebilir. Linkte telefon numarası ve diğer personelin bilgileri yoktur. Şu an link yenileme/iptal düğmesi yok; işten ayrılan personeli silmek linki geçersiz kılar. Link yenileme ve son kullanma tarihi yol haritasında.",
  },
  {
    soru: "Şu an kaç işletme kullanıyor?",
    cevap:
      "20 Ekim 2026 itibarıyla 8 işletme hesap açtı; 6'sı personel ekledi, 4'ü vardiya planı oluşturdu. Bunlar kayıt sayılarıdır, 'aktif müşteri' iddiası değildir. Uydurma yorum veya logo yayınlamıyoruz; ilk pilot işletmelerin izinli geri bildirimlerini burada yayınlayacağız.",
  },
  {
    soru: "Kaç personel ekleyebilirim?",
    cevap:
      "Sınır yok. Küçük bir kafeden kalabalık bir ekibe kadar aynı hesapla kullanabilirsin. İçe aktarma tek seferde en fazla 200 kişi alır; gerekirse birkaç dosyada aktarabilirsin.",
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

/** Ürünü gösteren mini çizelge — tarayıcı penceresi içinde (etkileşimsiz).
 *  Sayılar /demo ekranıyla **aynı kaynaktan** (lib/demo-data) gelir. */
function OrnekCizelge() {
  const ozet = demoOzet();

  const hucreRengi: Record<string, string> = {
    sabah: "border-amber-200 bg-amber-100 text-amber-900",
    aksam: "border-violet-200 bg-violet-100 text-violet-800",
    tamgun: "border-rose-200 bg-rose-100 text-rose-800",
    ara: "border-cyan-200 bg-cyan-100 text-cyan-800",
  };

  return (
    <div className="relative">
      <div
        className="amber-glow absolute -inset-8 -z-10 rounded-[3rem] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="kart overflow-hidden rounded-[24px] shadow-[0_24px_70px_-30px_rgba(20,24,27,0.35)]"
        role="img"
        aria-label={`Örnek haftalık vardiya planı: ${ozet.kisi} personel, Pazartesi–Pazar, toplam ${ozet.toplamVardiya} vardiya ve 45 saat kontrolü açık.`}
      >
        <div aria-hidden="true">
          <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50/80 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-medium text-zinc-500">
              zihnora.com.tr/panel
            </span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-semibold text-white">
              örnek veri
            </span>
          </div>

          <div className="px-4 pb-3 pt-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[13px] font-bold text-zinc-900">{ozet.isletme}</div>
                <div className="text-[11px] text-zinc-500">19 – 25 Ekim · Pzt–Paz</div>
              </div>
              <span className="cip !px-2 !py-0.5 !text-[10px]">
                {ozet.kisi} personel
              </span>
            </div>

            <div className="mt-3 grid grid-cols-[52px_repeat(7,minmax(0,1fr))] gap-1 text-[10px]">
              <div />
              {ozet.gunler.map((g) => (
                <div key={g} className="pb-1 text-center font-semibold text-zinc-500">
                  {g}
                </div>
              ))}
              {ozet.satirlar.map((s) => (
                <div key={s.id} className="contents">
                  <div className="flex min-w-0 items-center gap-1.5 py-1.5 text-[10px] font-semibold text-zinc-700">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.renk}`} />
                    <span className="truncate">{s.ad}</span>
                  </div>
                  {s.hucreler.map((h, i) => (
                    <div
                      key={i}
                      className={`my-0.5 truncate rounded-md border px-1 py-1 text-center text-[9px] font-medium ${
                        h.tur
                          ? hucreRengi[h.tur] ?? "border-zinc-200 bg-zinc-50 text-zinc-700"
                          : "border-dashed border-zinc-200 text-zinc-400"
                      }`}
                    >
                      {h.etiket ?? "—"}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 text-[10px] text-zinc-500">
              <span>
                Toplam {ozet.toplamVardiya} vardiya · {ozet.calisan}/{ozet.kisi} kişi
              </span>
              <span className="font-semibold text-emerald-700">
                ✓ {ozet.uyari > 0 ? `${ozet.uyari} uyarı` : "uyarı yok"}
              </span>
            </div>
          </div>
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
              Personelini ekle, günleri doldur, WhatsApp mesajını hazırla.
              Excel, kâğıt ve mesaj karmaşası olmadan.
            </p>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              {kullanici ? (
                <Link href="/panel" className="btn-cta h-12 px-7">
                  Panele git <span aria-hidden>→</span>
                </Link>
              ) : (
                <>
                  <Link href="/kayit" className="btn-cta h-12 px-7">
                    Ücretsiz hesap aç <span aria-hidden>→</span>
                  </Link>
                  <Link href="/demo" className="btn-ghost h-12 px-7">
                    Demoyu dene <span aria-hidden>↗</span>
                  </Link>
                </>
              )}
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-zinc-600">
              {[
                "Kredi kartı yok",
                "Demo kayıt istemez",
                "Türkçe & mevzuat uyarıları",
                "Türkiye'de barındırılıyor",
              ].map(
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

            <p className="mt-5 text-[13px] leading-relaxed text-zinc-500">
              Sorun mu var?{" "}
              <a
                href="mailto:destek@zihnora.com.tr"
                className="font-semibold text-zinc-700 underline underline-offset-2 hover:text-amber-700"
              >
                destek@zihnora.com.tr
              </a>
              <span className="mx-1.5 text-zinc-300" aria-hidden>
                ·
              </span>
              <a
                href="mailto:hmum117413@gmail.com"
                className="font-semibold text-zinc-700 underline underline-offset-2 hover:text-amber-700"
              >
                hmum117413@gmail.com
              </a>
            </p>
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

          <p className="mt-6 text-[12px] leading-relaxed text-zinc-500">
            &quot;Mevzuata uygun&quot; demiyoruz; çünkü bu bir hukuki uygunluk
            iddiası olur. Neyi kontrol ettiğimizi, neyi etmediğimizi ve sorumluluk
            notunu{" "}
            <a href="#mevzuat" className="font-semibold text-amber-700 underline underline-offset-2">
              Mevzuat kapsamı
            </a>{" "}
            bölümünde açıkça yazdık.
          </p>
        </div>
      </section>

      {/* Mevzuat kapsamı */}
      <section id="mevzuat" className="bolum-gri scroll-mt-20">
        <div className="kap py-16 sm:py-24" data-reveal>
          <BolumBasligi
            etiket="Mevzuat kapsamı"
            baslik="Neyi kontrol ediyoruz, neyi etmiyoruz?"
            aciklama="Plan yaparken bazı süre kurallarını işaretliyoruz. Bu, bağımsız bir hukuk veya mali müşavir denetimi değildir; 'mevzuata uygun' sertifikası da değildir."
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="kart p-6">
              <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                  ✓
                </span>
                Kontrol edilir
              </h3>
              <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-zinc-600">
                <li>
                  <strong className="text-zinc-900">Haftalık 45 saat</strong> — İş
                  Kanunu 4857 m.63. Aşım, fazla mesai uyarısı olarak gösterilir.
                </li>
                <li>
                  <strong className="text-zinc-900">Günlük 11 saat dinlenme</strong>{" "}
                  — 4857 m.69. İki vardiya arasındaki süre hesaplanır.
                </li>
                <li>
                  <strong className="text-zinc-900">Aynı gün çift vardiya</strong> —
                  çakışan atamalar hata olarak işaretlenir.
                </li>
                <li>
                  <strong className="text-zinc-900">Gece çalışması 7,5 saat</strong>{" "}
                  — 4857 m.69. 20:00–06:00 arasına denk gelen süre kontrol edilir.
                </li>
                <li>
                  <strong className="text-zinc-900">Resmî tatil günleri</strong> —
                  2429 sayılı Kanun. Tatilde çalışma atanmışsa uyarı verilir.
                </li>
              </ul>
            </div>

            <div className="kart p-6">
              <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-800">
                  ✗
                </span>
                Kapsam dışı
              </h3>
              <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-zinc-600">
                <li>
                  <strong className="text-zinc-900">
                    Haftalık 24 saat kesintisiz hafta tatili
                  </strong>{" "}
                  — ayrıca kontrol edilmez; plana işaretlenmez.
                </li>
                <li>
                  <strong className="text-zinc-900">
                    Fazla mesai ücreti, puantaj ve bordro
                  </strong>{" "}
                  — ürün para hesabı yapmaz, muhasebe/bordro aktarımı yoktur.
                </li>
                <li>
                  <strong className="text-zinc-900">
                    Yıllık izin kullanımı ve bakiye
                  </strong>{" "}
                  — yalnızca hak günü görünür; izin düşümü otomatik yapılmaz.
                </li>
                <li>
                  <strong className="text-zinc-900">
                    İş sözleşmesi, toplu iş sözleşmesi, sektörel istisnalar
                  </strong>{" "}
                  — işletmeye özel kurallar araca girilmez.
                </li>
                <li>
                  <strong className="text-zinc-900">Hukuki görüş</strong> — bağımsız
                  hukukçu veya mali müşavir denetimi yoktur.
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
            <strong>Sorumluluk notu:</strong> Vardiya bir planlama ve hatırlatma
            aracıdır. Uyarılar bilgilendirme amaçlıdır, hukuki danışmanlık
            değildir. Mevzuatın işletmene nasıl uygulanacağından ve nihai plandan
            işveren sorumludur. Şüpheli durumlarda iş hukuku uzmanına veya mali
            müşavire danış.
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

      {/* Ürün ekranı */}
      <section id="urun" className="scroll-mt-20">
        <div className="kap py-16 sm:py-24" data-reveal>
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-12">
            <div>
              <BolumBasligi
                etiket="Ürün"
                baslik="Ekranı gör, sonra karar ver."
                aciklama="Aşağıdaki görüntü ürünün plan ekranından, örnek veriyle alındı. Kayıt olmadan aynı ekranı açıp hücrelere tıklayabilir, 45 saat ve dinlenme uyarılarını canlı görebilirsin."
              />
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/demo" className="btn-cta h-11 px-6">
                  Demoyu aç <span aria-hidden>→</span>
                </Link>
                <Link href="/kayit" className="btn-ghost h-11 px-6">
                  Ücretsiz başla
                </Link>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                Demo hiçbir veri kaydetmez. Hesap açmadan tüm ekranı görebilirsin.
              </p>
            </div>

            <Link
              href="/demo"
              className="group relative block overflow-hidden rounded-[20px] border border-zinc-200 bg-white shadow-[0_24px_70px_-30px_rgba(20,24,27,0.35)]"
              aria-label="Ürün ekran görüntüsü — demoyu aç"
            >
              <Image
                src="/urun-paneli.png"
                alt="Vardiya panelinin haftalık plan ekranı: personel, günler, vardiyalar ve toplam saatler."
                width={1440}
                height={960}
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.01]"
              />
              <span className="absolute bottom-3 right-3 rounded-full bg-zinc-950/85 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
                Demoyu dene ↗
              </span>
            </Link>
          </div>
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

      {/* Karşılaştırma */}
      <section id="karsilastirma" className="kap scroll-mt-20 py-16 sm:py-24" data-reveal>
        <BolumBasligi
          etiket="Neden Vardiya?"
          baslik="Excel, kâğıt ve mesaj karmaşasıyla yan yana."
          aciklama="Aynı işi yapan üç yöntem. Satırlar gerçek günlük işleyişten; sütunlar abartısız."
        />
        <div className="mt-8 overflow-x-auto rounded-[20px] border border-zinc-200 bg-white">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <caption className="sr-only">
              Excel, kâğıt ve Vardiya&apos;nın günlük vardiya yönetimindeki farkları
            </caption>
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                <th scope="col" className="px-4 py-3 text-xs font-semibold text-zinc-500">
                  İhtiyaç
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-semibold text-zinc-500">
                  Excel
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-semibold text-zinc-500">
                  Kâğıt
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-bold text-amber-800">
                  Vardiya
                </th>
              </tr>
            </thead>
            <tbody>
              {karsilastirma.map((k) => (
                <tr key={k.ozellik} className="border-b border-zinc-100 last:border-0">
                  <th scope="row" className="px-4 py-3 text-left text-[13px] font-semibold text-zinc-800">
                    {k.ozellik}
                  </th>
                  <td className="px-4 py-3 text-[13px] text-zinc-500">{k.excel}</td>
                  <td className="px-4 py-3 text-[13px] text-zinc-500">{k.kagit}</td>
                  <td className="bg-amber-50 px-4 py-3 text-[13px] font-medium text-zinc-900">
                    <span className="mr-1.5 text-emerald-600" aria-hidden>
                      ✓
                    </span>
                    {k.vardiya}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Karşılaştırma genel bir çerçevedir; Excel ve kâğıt da doğru kurulduğunda
          iş görür. Fark, planın ekip içinde güncel kalması ve süre kontrolünün
          otomatik olmasıdır.
        </p>
      </section>

      {/* Kimler için */}
      <section className="kap py-16 sm:py-24" data-reveal>
        <BolumBasligi
          etiket="Kimler için"
          baslik="Kafe, restoran ve pastaneler için tasarlandı."
          aciklama="Personel sayısı 5 ile 30 arasında olan işletmeler için ideal. Şu an tek işletme ve tek yönetici hesabı var; çok şubeli ekipler her şubeyi ayrı hesapla kullanabilir."
          ortala
        />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {sektorler.map((s) => (
            <div
              key={s.ad}
              className="kart p-4 text-center transition-colors hover:border-amber-300"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto h-6 w-6 text-amber-700"
                aria-hidden="true"
              >
                {s.yollar.map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
              <div className="mt-2 text-sm font-bold text-zinc-900">{s.ad}</div>
              <div className="mt-0.5 text-[11px] text-zinc-500">{s.alt}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Yol haritası / şeffaflık */}
      <section id="yol-haritasi" className="bolum-gri scroll-mt-20">
        <div className="kap py-16 sm:py-24" data-reveal>
          <BolumBasligi
            etiket="Yol haritası"
            baslik="Bugün ne var, ne yok?"
            aciklama="Satın almadan önce eksikleri bilmen daha iyi. Vardiya'nın bugünkü sınırlarını açıkça yazıyoruz; sıradaki işleri de tahminle değil, bu listeyle takip ediyoruz."
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="kart p-6">
              <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                  ✓
                </span>
                Bugün kullanabilirsin
              </h3>
              <ul className="mt-4 space-y-2.5 text-[13px] leading-relaxed text-zinc-600">
                {[
                  "Sınırsız personel ve haftalık plan",
                  "Excel'den kopyala-yapıştır veya CSV içe aktarma",
                  "45 saat, 11 saat dinlenme, gece ve resmî tatil uyarıları",
                  "Personele özel, girişsiz program linki",
                  "WhatsApp'a hazır mesaj ve yazdırılabilir çizelge",
                  "Aylık rapor, CSV indirme, veri indirme ve hesap silme",
                ].map((m) => (
                  <li key={m} className="flex gap-2">
                    <span className="mt-0.5 text-emerald-600" aria-hidden>
                      ✓
                    </span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="kart p-6">
              <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-800">
                  →
                </span>
                Sırada
              </h3>
              <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-zinc-600">
                <li>
                  <strong className="text-zinc-900">Çok şube yönetimi:</strong> tek
                  panelden şube açma, şube bazlı personel ve rapor. Şimdilik her
                  şube kendi hesabıyla kullanılabilir.
                </li>
                <li>
                  <strong className="text-zinc-900">Müdür ve çalışan yetkileri:</strong>{" "}
                  müdürün yalnız kendi şubesini görmesi, çalışanın salt-okunur erişimi.
                </li>
                <li>
                  <strong className="text-zinc-900">Vardiya değişim talebi:</strong>{" "}
                  personelin uygulama içinden talep göndermesi ve onay akışı.
                </li>
                <li>
                  <strong className="text-zinc-900">İzin / mazeret girişi:</strong>{" "}
                  talep, bakiye ve planın otomatik güncellenmesi.
                </li>
                <li>
                  <strong className="text-zinc-900">Otomatik bildirim:</strong> plan
                  değişince personele WhatsApp/e-posta bildirimi.
                </li>
              </ul>
              <p className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] leading-relaxed text-zinc-500">
                Bunlar hazır olduğunda duyurulacak. Bugün olmayan bir özelliği
                varmış gibi göstermiyoruz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Günlük işleyiş */}
      <section id="gunluk" className="kap scroll-mt-20 py-16 sm:py-24" data-reveal>
        <BolumBasligi
          etiket="Günlük işleyiş"
          baslik="Vardiya değişimi, izin, onay ve puantaj."
          aciklama="Bunlar gerçek hayatta en çok sorulan şeyler. Bugün ne yapabildiğini ve neyi uygulama dışında çözmen gerektiğini açıkça yazıyoruz."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="kart p-5">
            <h3 className="text-[15px] font-bold text-zinc-900">Vardiya değişimi</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
              <strong>Bugün:</strong> Personel talebi WhatsApp&apos;tan iletir; sen
              panelde iki hücreyi değiştirip güncel mesajı gönderirsin.
              <br />
              <strong>Yok:</strong> Uygulama içi takas isteği ve onay akışı.
            </p>
          </div>
          <div className="kart p-5">
            <h3 className="text-[15px] font-bold text-zinc-900">
              İzin ve mazeret
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
              <strong>Bugün:</strong> İzin gününü planda boş bırakırsın; yıllık izin
              hakkı personel detayında görünür.
              <br />
              <strong>Yok:</strong> İzin talebi, bakiye düşümü ve otomatik onay.
            </p>
          </div>
          <div className="kart p-5">
            <h3 className="text-[15px] font-bold text-zinc-900">
              Gördü / onayladı mı?
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
              <strong>Bugün:</strong> Personel linki salt-okunur; programı her zaman
              son hâliyle görür.
              <br />
              <strong>Yok:</strong> Okundu bilgisi, &quot;onayladım&quot; düğmesi ve
              okunmayanlara hatırlatma.
            </p>
          </div>
          <div className="kart p-5">
            <h3 className="text-[15px] font-bold text-zinc-900">
              Fazla mesai ve puantaj
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
              <strong>Bugün:</strong> Haftalık saatleri ve 45 saat üstünü hesaplar;
              aylık raporu CSV olarak indirirsin.
              <br />
              <strong>Yok:</strong> Ücret, bordro, muhasebe aktarımı ve resmî
              puantaj.
            </p>
          </div>
        </div>
      </section>

      {/* Gizlilik */}
      <section className="bolum-gri">
        <div className="kap grid gap-8 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16" data-reveal>
          <div>
            <BolumBasligi
              etiket="Gizlilik"
              baslik="Verin senin. Reklam yok, takip yok."
              aciklama="Ücret bilgisi istenmez; üçüncü taraf analitik betiği kullanılmaz. Her işletmenin verisi kendi hesabına kilitlidir. Personel verilerinde veri sorumlusu işletme, Vardiya veri işleyendir."
            />
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/gizlilik"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 underline-offset-4 hover:underline"
              >
                Gizlilik ve KVKK aydınlatması <span aria-hidden>→</span>
              </Link>
              <Link
                href="/personel-aydinlatma"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 underline-offset-4 hover:underline"
              >
                Personel aydınlatma metni örneği <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { b: "Hesaba kilitli", m: "Başka bir hesap senin verini göremez." },
              { b: "Ücret istenmez", m: "Maaş ve maliyet bilgisi toplanmaz." },
              { b: "Yurt içinde", m: "Veriler Türkiye'deki sunucuda tutulur." },
              { b: "Roller net", m: "Sorumlu işletme, işleyen Vardiya." },
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
              Vardiya&apos;yı, kafe ve restoranlarda haftalık planın Excel&apos;de
              kurulup WhatsApp&apos;ta kaybolduğunu gördüğü için geliştirdi.
              Amacı tek: planı tek ekranda tutmak ve ekibin her zaman güncel
              sürümü görmesini sağlamak.
            </p>
          </div>
          <Link href="/hakkimizda" className="btn-ghost h-10 shrink-0 px-5 text-[13px]">
            Hakkımızda <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* Şeffaflık + destek */}
      <section id="seffaflik" className="bolum-gri scroll-mt-20">
        <div className="kap py-16 sm:py-24" data-reveal>
          <BolumBasligi
            etiket="Erken erişim"
            baslik="Uydurma yorum yok. Olduğu gibi."
            aciklama="Vardiya 18 Ekim 2026'da yayına girdi. Henüz yayınlanmış müşteri yorumu, işletme logosu veya 'binlerce kullanıcı' iddiası yok. İlk pilotların izinli geri bildirimlerini burada yayınlayacağız."
            ortala
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="kart p-6">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-emerald-700"
                aria-hidden="true"
              >
                <path d="M12 21V10" />
                <path d="M12 10C12 6 9 4 4 4c0 5 3 7 8 6Z" />
                <path d="M12 13c0-4 3-6 8-6 0 5-3 7-8 6Z" />
              </svg>
              <h3 className="mt-3 text-[15px] font-bold text-zinc-900">
                Erken erişim
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
                Ürün yeni ve tek kişi tarafından geliştiriliyor. Yorum yerine ne
                olduğunu ve ne olmadığını yazıyoruz. Pilot kullanıcı olmak istersen
                doğrudan yazabilirsin.
              </p>
            </div>
            <div className="kart border-amber-300 bg-amber-50 p-6">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-amber-700"
                aria-hidden="true"
              >
                <path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3Z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <h3 className="mt-3 text-[15px] font-bold text-zinc-900">
                Fiyat taahhüdü
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-700">
                Bugünkü <strong>temel özellikler kalıcı ücretsiz</strong>. İleride
                şube veya otomasyon gibi ileri özellikler Pro olabilir; temel plan
                ücretsiz kalır. Ücretli bir özellik gelirse <strong>30 gün önce</strong>{" "}
                haber verilir, kart bilgisi istenmez.
              </p>
            </div>
            <div className="kart p-6">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-zinc-700"
                aria-hidden="true"
              >
                <path d="M3 6h18v12H3z" />
                <path d="M3 7l9 6 9-6" />
              </svg>
              <h3 className="mt-3 text-[15px] font-bold text-zinc-900">
                Doğrudan kurucuya yaz
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
                Sorunu, önerini veya eksik gördüğün şeyi doğrudan yaz. Destek
                Türkçe ve genellikle aynı iş günü içinde.
              </p>
              <div className="mt-3 flex flex-col gap-1">
                <a
                  href="mailto:destek@zihnora.com.tr"
                  className="break-all text-[13px] font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-800"
                >
                  destek@zihnora.com.tr
                </a>
                <a
                  href="mailto:hmum117413@gmail.com"
                  className="break-all text-[13px] font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-800"
                >
                  hmum117413@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center justify-between gap-4 rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row">
            <div>
              <p className="text-sm font-bold text-amber-900">
                Kurulumda takıldın mı? Birlikte bakalım.
              </p>
              <p className="mt-0.5 text-[12px] text-amber-900/80">
                15 dakikalık kısa bir görüşme ayarlayabiliriz; robot değil, kurucu
                yanıtlıyor.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <a
                href="mailto:destek@zihnora.com.tr?subject=Vardiya%20-%2015%20dk%20g%C3%B6r%C3%BC%C5%9Fme"
                className="btn-cta h-10 px-4 text-[13px]"
              >
                Görüşme iste
              </a>
              <Link href="/iletisim" className="btn-ghost h-10 px-4 text-[13px]">
                İletişim formu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Fiyatlandırma */}
      <section className="kap py-16 sm:py-24" data-reveal>
        <BolumBasligi
          etiket="Fiyatlandırma"
          baslik="Tek plan: tamamen ücretsiz."
          aciklama="Bugünkü temel özellikler kalıcı ücretsiz. İleride şube/otomasyon gibi ileri özellikler Pro olabilir; temel plan ücretsiz kalır."
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
              "WhatsApp'a hazır mesaj",
              "Personele özel link",
              "Aylık rapor & CSV",
              "Veri indirme & hesap silme",
              "Telefona ekle (PWA)",
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
          <p className="mt-2 text-center text-[11px] leading-relaxed text-zinc-500">
            <strong>Fiyat taahhüdü:</strong> Bugünkü temel özellikler kalıcı
            ücretsiz. İleride şube/otomasyon gibi ileri özellikler Pro olabilir;
            temel plan ücretsiz kalır. Ücretli bir özellik gelirse 30 gün önce
            haber verilir, kart bilgisi istenmez.
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
                Önce <Link href="/demo" className="underline underline-offset-2">demoya</Link> bakabilirsin.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {kullanici ? (
                <Link href="/panel" className="btn-cta h-12 px-6">
                  Panele git <span aria-hidden>→</span>
                </Link>
              ) : (
                <>
                  <Link href="/kayit" className="btn-cta h-12 px-6">
                    Ücretsiz başla <span aria-hidden>→</span>
                  </Link>
                  <Link
                    href="/giris"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Giriş
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
