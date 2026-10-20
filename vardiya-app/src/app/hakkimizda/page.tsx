import Link from "next/link";
import { aktifKullanici } from "@/lib/auth";
import { kaydetZiyaret } from "@/lib/visits";

export const metadata = {
  title: "Hakkımızda — Vardiya",
  description:
    "Vardiya'nın çıkış hikâyesi, misyonu, vizyonu ve değerleri. Kafe ve restoranlar için sade, gizliliğe saygılı vardiya yönetimi.",
  alternates: { canonical: "/hakkimizda" },
};

export const dynamic = "force-dynamic";

const degerler = [
  {
    baslik: "Sadelik",
    metin:
      "Kullanılmayan özellik, olmayan özelliktir. Vardiya yalnızca planlamak için gerekeni yapar; PDKS, bordro ve maliyet muhasebesi başka işlerin konusudur.",
  },
  {
    baslik: "Gizlilik",
    metin:
      "Müşteri verisi bir ürün değildir. Ücret bilgisi istenmez, reklam pikseli kullanılmaz ve her işletmenin verisi yalnızca kendi hesabına bağlıdır.",
  },
  {
    baslik: "Şeffaflık",
    metin:
      "Fiyat tek: ücretsiz. Kredi kartı, abonelik, deneme süresi veya gizli maliyet yok. Ürünün sınırları da açıkça yazılır.",
  },
];

const nedenler = [
  {
    baslik: "Tek ekran",
    metin:
      "Personel, vardiya şablonları, duyurular ve gün notları aynı yerde. Dosya, sekme ve mesaj kalabalığı yok.",
  },
  {
    baslik: "Mevzuata saygı",
    metin:
      "Haftalık 45 saat, iki vardiya arası 11 saat dinlenme ve resmî tatil uyarıları plan yaparken görünür.",
  },
  {
    baslik: "Gizliliğe saygı",
    metin:
      "Ücret bilgisi istenmez ve saklanmaz. Veriler Türkiye'deki sunucuda, işletmeye özel veritabanında tutulur.",
  },
  {
    baslik: "Gerçekten ücretsiz",
    metin:
      "Kredi kartı, abonelik, deneme süresi veya reklam yok. Ürünün tamamı ücretsiz kullanılabilir.",
  },
];

export default async function HakkimizdaPage() {
  const kullanici = await aktifKullanici();
  await kaydetZiyaret();

  return (
    <main className="flex-1">
      <div className="sayfa max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
          Hakkımızda
        </p>
        <h1 className="sayfa-baslik mt-1">Vardiya neden var?</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-zinc-600 sm:text-base">
          Kafe ve restoranların haftalık vardiya planını Excel, kâğıt ve
          WhatsApp karmaşasından kurtarmak için kuruldu. Amaç büyük bir yazılım
          paketi değil; işletme sahibinin beş dakikada bitirebildiği, personelin
          de tek bakışta anladığı sade bir araç.
        </p>

        {/* Sayfa içi menü */}
        <nav aria-label="Sayfa içi menü" className="mt-6 flex flex-wrap gap-1.5">
          {[
            { href: "#kurucu", ad: "Kurucu" },
            { href: "#mesaj", ad: "CEO Mesajı" },
            { href: "#misyon", ad: "Misyon & Vizyon" },
            { href: "#degerler", ad: "Değerler" },
          ].map((b) => (
            <a
              key={b.href}
              href={b.href}
              className="cip transition-colors hover:border-zinc-300 hover:text-zinc-900"
            >
              {b.ad}
            </a>
          ))}
        </nav>

        {/* Kurucu */}
        <section id="kurucu" className="kart mt-8 scroll-mt-24 overflow-hidden">
          <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:p-8">
            <div
              className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-amber-700 text-2xl font-bold tracking-tight text-white"
              aria-hidden="true"
            >
              HM
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                Kurucu
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Hasan Mum
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500">Kurucu &amp; CEO</p>

              <div className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-600">
                <p>
                  Hasan Mum, Vardiya&apos;yı kafe ve restoran sektöründe çalıştığı
                  dönemde tanık olduğu bir sorundan yola çıkarak geliştirdi.
                  Haftalık plan Excel&apos;de hazırlanıyor, her değişiklik
                  WhatsApp&apos;ta ayrı bir mesaja dönüşüyor ve son sürümün kimde
                  olduğu çoğu zaman bilinmiyordu. Personel tarafında ise aynı soru
                  dönüp duruyordu: &quot;Ben bu hafta hangi gün çalışıyorum?&quot;
                </p>
                <p>
                  Vardiya, bu iki tarafı aynı ekranda buluşturmak için tasarlandı.
                  İşletme sahibi haftalık planı birkaç dakikada hazırlar; personel
                  kendi programını giriş yapmadan, kişisel bir bağlantıyla görür.
                  Ne PDKS, ne bordro, ne de günler süren bir kurulum gerekir.
                </p>
                <p>
                  Ürün hâlâ aynı soruyla şekilleniyor:{" "}
                  <strong className="font-semibold text-zinc-800">
                    &quot;Bu, işletmenin işini gerçekten kolaylaştırıyor mu?&quot;
                  </strong>{" "}
                  Cevabı &quot;hayır&quot; olan hiçbir özellik Vardiya&apos;ya
                  eklenmiyor.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CEO mesajı */}
        <section
          id="mesaj"
          className="mt-10 scroll-mt-24 rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8"
        >
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800">
            CEO Mesajı
          </h2>
          <blockquote className="mt-3 text-lg font-medium leading-relaxed text-amber-900 sm:text-xl">
            &quot;İyi bir vardiya planı, işletme sahibinin aklında kalmamalı;
            ekibin her üyesinin aynı şeyi gördüğü tek bir yerde olmalı.&quot;
          </blockquote>
          <p className="mt-3 text-sm text-amber-800">
            Hasan Mum · Kurucu &amp; CEO
          </p>
          <p className="mt-4 border-t border-amber-200 pt-4 text-sm leading-relaxed text-amber-900">
            Vardiya&apos;nın yol haritası bu ilkeye göre belirleniyor: yeni bir
            özellik eklemeden önce, mevcut planlamayı daha da sadeleştirmenin bir
            yolunu arıyoruz.
          </p>
        </section>

        {/* Misyon & Vizyon */}
        <section id="misyon" className="mt-10 scroll-mt-24">
          <h2 className="text-xl font-semibold tracking-tight">Misyon &amp; Vizyon</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="kart p-5">
              <h3 className="text-sm font-semibold text-zinc-800">Misyonumuz</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                Kafe ve restoranların haftalık vardiya planlamasını; kurulum
                gerektirmeyen, Türkçe ve mevzuata saygılı tek bir araçla beş
                dakikaya indirmek.
              </p>
            </div>
            <div className="kart p-5">
              <h3 className="text-sm font-semibold text-zinc-800">Vizyonumuz</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                Türkiye&apos;deki her küçük işletmenin, pahalı ve karmaşık
                yazılımlara ihtiyaç duymadan profesyonel bir vardiya düzenine
                sahip olması.
              </p>
            </div>
          </div>
        </section>

        {/* Neden Vardiya */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">Neden Vardiya?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {nedenler.map((o) => (
              <div key={o.baslik} className="rounded-xl border border-zinc-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-zinc-800">{o.baslik}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">{o.metin}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Değerler */}
        <section id="degerler" className="mt-10 scroll-mt-24">
          <h2 className="text-xl font-semibold tracking-tight">Değerlerimiz</h2>
          <div className="mt-4 space-y-4">
            {degerler.map((d, i) => (
              <div key={d.baslik} className="flex gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-800">{d.baslik}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-zinc-600">{d.metin}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold tracking-tight">
            Vardiya&apos;yı kendi işletmende dene
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Hesap açmak 30 saniye sürer. Kredi kartı istemiyoruz.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {kullanici ? (
              <Link href="/panel" className="btn-birincil h-10 px-5">
                Panele git →
              </Link>
            ) : (
              <Link href="/kayit" className="btn-birincil h-10 px-5">
                Ücretsiz hesap aç
              </Link>
            )}
            <Link href="/yardim" className="btn-ikincil h-10 px-5">
              Nasıl çalışır?
            </Link>
          </div>
        </section>

        <p className="mt-8 text-sm">
          <Link href="/" className="underline hover:text-zinc-900">
            ← Ana sayfaya dön
          </Link>
        </p>
      </div>
    </main>
  );
}
