import Link from "next/link";
import { aktifKullanici } from "@/lib/auth";
import { kaydetZiyaret } from "@/lib/visits";

export const metadata = {
  title: "Hakkımızda — Vardiya",
  description:
    "Vardiya'yı neden yazdım, nasıl çalışıyorum, hangi ilkelerle. Kurucudan, birinci ağızdan.",
  alternates: { canonical: "/hakkimizda" },
};

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------
   İçerik — kurucunun ağzından, birinci tekil.
   Kurallar (20 Eki 2026 kararları): kişisel bilgi yok (konum, kişisel
   e-posta, sosyal hesap), uydurma sayı/yorum yok, eğitim/staj yok.
   ------------------------------------------------------------------ */

const zamanCizgisi = [
  {
    donem: "Sektör yılları",
    baslik: "Sorunu bizzat yaşadım",
    metin:
      "Plan Excel'deydi, haberleşme WhatsApp'taydı; ikisi aynı gün bile güncel kalmazdı. Sorunu bir rapordan okumadım; içinde çalışarak, her hafta yeniden yaşadım.",
  },
  {
    donem: "İlk taslak",
    baslik: "Tek ekran, tek hafta",
    metin:
      "Kâğıda ilk çizdiğim şey bir tabloydu: personel solda, günler üstte, bir de \u201cgönder\u201d düğmesi. Bugünkü panel hâlâ o taslağa benziyor; fazlasını bilerek eklemedim.",
  },
  {
    donem: "18 Ekim 2026",
    baslik: "Vardiya yayına girdi",
    metin:
      "Site o gün açıldı. O günden beri yazdığım her satır, gerçek işletmelerin elinde sınanıyor; burada gördüğün her şey canlıda çalışan sürüm.",
  },
  {
    donem: "Bugün",
    baslik: "Aynı soruyla",
    metin:
      "Her yeni özellik tek bir sorudan geçiyor: \u201cBu, işletmenin işini gerçekten kolaylaştırıyor mu?\u201d Cevabı hayır olan hiçbir şey eklenmiyor.",
  },
];

const ilkeler = [
  {
    baslik: "Sadelik",
    metin:
      "Kullanılmayacak hiçbir özelliği eklemem. Vardiya PDKS değil, bordro değil, muhasebe programı değil; haftalık vardiyayı planlar ve ekibe ulaştırır.",
  },
  {
    baslik: "Gizlilik",
    metin:
      "Ücret bilgisi sormam, reklam pikseli koymam, verini kimseye satmam. Veriler Türkiye'deki sunucuda, yalnızca senin hesabına kilitli durur.",
  },
  {
    baslik: "Dürüstlük",
    metin:
      "Neyi kontrol edip neyi etmediğimi açıkça yazarım. Olmayan özelliği varmış gibi göstermem; uydurma yorum ve logo yayınlamam.",
  },
  {
    baslik: "Erişilebilirlik",
    metin:
      "Bu araç küçük işletmeler için var; o yüzden ücretsiz. Ücretli bir plan gelirse bir ay önceden haber veririm, kart bilgini hiç istemem.",
  },
];

export default async function HakkimizdaPage() {
  const kullanici = await aktifKullanici();
  await kaydetZiyaret();

  return (
    <main className="vitrin flex-1">
      {/* ------------------------------------------------------- HERO */}
      <section className="v-kap pb-16 pt-14 sm:pb-20 sm:pt-20">
        <p className="v-etiket">Hakkımızda</p>
        <h1 className="v-h1 mt-6 max-w-[17ch]">
          Vardiya&apos;yı, kendi gördüğüm dağınıklığı bitirmek için yazdım.
        </h1>
        <p className="v-p mt-6 max-w-[52ch]">
          Adım Hasan Mum. Kafe ve restoranlarda çalıştığım dönemde, haftalık
          vardiya planının ne kadar zor takip edildiğini bizzat gördüm.
          Vardiya, o sorunu tek ekranda bitirmek için yazdığım araç;
          Zihnora&apos;nın ilk ürünü.
        </p>
      </section>

      {/* ---------------------------------------------------- 01 HİKÂYE */}
      <section className="border-t border-[#1c1c20]">
        <div className="v-kap grid gap-10 py-16 sm:py-20 lg:grid-cols-[220px_1fr] lg:gap-16">
          <p className="v-etiket">01 — Hikâye</p>
          <div className="hk-makale">
            <p>
              Çalıştığım yerlerde haftalık plan hep aynı şekilde hazırlanırdı:
              biri Excel&apos;de bir tablo doldurur, fotoğrafını WhatsApp
              grubuna atar, ertesi gün bir hücre değişir ve her şey başa
              dönerdi. Hafta sonunda &quot;son sürüm&quot;ün hangisi olduğunu
              kimse kesin olarak bilemezdi.
            </p>
            <p>
              Personel tarafında ise tek bir soru dönüp dururdu:{" "}
              <em className="text-[#d4d4d8] not-italic">
                &quot;Ben bu hafta hangi gün çalışıyorum?&quot;
              </em>{" "}
              Cevap bazen bir fotoğrafın köşesinde kayboluyor, bazen hiç
              gelmiyordu. Planı yapan da, planı takip eden de yoruluyordu.
            </p>
            <p>
              Bir gün kendime basit bir hedef koydum: plan tek bir yerde
              yazılacak ve herkes aynı şeyi görecek. Ne bir fazla, ne bir
              eksik. Vardiya işte bu cümlenin ürünü; önce kendi ihtiyacıma,
              sonra aynısını yaşayan her işletmeye.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------- 02 ZAMAN ÇİZLGİSİ */}
      <section className="border-t border-[#1c1c20]">
        <div className="v-kap grid gap-10 py-16 sm:py-20 lg:grid-cols-[220px_1fr] lg:gap-16">
          <p className="v-etiket">02 — Zaman çizgisi</p>
          <div className="border-t border-[#1c1c20]">
            {zamanCizgisi.map((z) => (
              <div
                key={z.donem}
                className="grid gap-1 border-b border-[#1c1c20] py-6 sm:grid-cols-[170px_1fr] sm:gap-8"
              >
                <p className="font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.16em] text-[#85858e]">
                  {z.donem}
                </p>
                <div>
                  <h3 className="text-[15px] font-semibold tracking-tight text-[#ededf0]">
                    {z.baslik}
                  </h3>
                  <p className="mt-1.5 max-w-[64ch] text-[13.5px] leading-relaxed text-[#8f8f98]">
                    {z.metin}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- 03 İLKELER */}
      <section className="border-t border-[#1c1c20]">
        <div className="v-kap grid gap-10 py-16 sm:py-20 lg:grid-cols-[220px_1fr] lg:gap-16">
          <div>
            <p className="v-etiket">03 — İlkeler</p>
            <p className="mt-4 max-w-[24ch] text-[13px] leading-relaxed text-[#8f8f98]">
              Dört ilke; hepsi bu kadar. Her karar bunlardan biriyle
              ölçülüyor.
            </p>
          </div>
          <div className="grid border-t border-[#1c1c20] sm:grid-cols-2">
            {ilkeler.map((ilke, i) => (
              <div
                key={ilke.baslik}
                className={`border-b border-[#1c1c20] py-7 ${
                  i % 2 === 0
                    ? "sm:pr-10"
                    : "sm:border-l sm:border-[#1c1c20] sm:pl-10"
                }`}
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-[#7d7d86]">
                    0{i + 1}
                  </span>
                  <h3 className="text-[15px] font-semibold tracking-tight text-[#ededf0]">
                    {ilke.baslik}
                  </h3>
                </div>
                <p className="mt-2 pl-8 text-[13.5px] leading-relaxed text-[#8f8f98]">
                  {ilke.metin}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- İMZA */}
      <section className="border-t border-[#1c1c20]">
        <div className="v-kap py-20 sm:py-28">
          <figure className="mx-auto max-w-[880px] text-center">
            <blockquote className="hk-alinti">
              &ldquo;İyi bir vardiya planı işletme sahibinin aklında
              kalmamalı; ekibin her üyesinin aynı şeyi gördüğü tek bir yerde
              olmalı.&rdquo;
            </blockquote>
            <figcaption className="mt-10 flex items-center justify-center gap-4">
              <span
                aria-hidden="true"
                className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f59e0b] text-lg font-bold tracking-tight text-[#0a0a0b]"
              >
                HM
              </span>
              <span className="text-left leading-tight">
                <span className="block text-[15px] font-semibold text-[#ededf0]">
                  Hasan Mum
                </span>
                <span className="mt-1 block font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#85858e]">
                  Kurucu &amp; Geliştirici
                </span>
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ----------------------------------------- 04 MİSYON & VİZYON */}
      <section className="border-t border-[#1c1c20]">
        <div className="v-kap grid gap-10 py-16 sm:py-20 lg:grid-cols-[220px_1fr] lg:gap-16">
          <p className="v-etiket">04 — Misyon &amp; vizyon</p>
          <div className="grid gap-px border-t border-[#1c1c20] sm:grid-cols-2">
            <div className="border-b border-[#1c1c20] py-8 sm:border-b-0 sm:pr-10">
              <h3 className="text-[15px] font-semibold tracking-tight text-[#ededf0]">
                Misyonum
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[#8f8f98]">
                Kafe ve restoranların haftalık vardiya planlamasını beş
                dakikaya indirmek; kurulumsuz, Türkçe, süre uyarılarıyla tek
                araç.
              </p>
            </div>
            <div className="border-b border-[#1c1c20] py-8 sm:border-b-0 sm:border-l sm:border-[#1c1c20] sm:pl-10">
              <h3 className="text-[15px] font-semibold tracking-tight text-[#ededf0]">
                Vizyonum
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[#8f8f98]">
                Türkiye&apos;deki her küçük işletmenin, pahalı ve karmaşık
                yazılımlara ihtiyaç duymadan profesyonel bir vardiya düzenine
                sahip olması.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- CTA */}
      <section className="border-t border-[#1c1c20]">
        <div className="v-kap py-20 text-center sm:py-24">
          <p className="v-etiket">Tanışalım</p>
          <h2 className="v-h2 mx-auto mt-5 max-w-[20ch]">
            Hâlâ okuyorsan, planını da birlikte bitirelim.
          </h2>
          <p className="v-p mx-auto mt-5 max-w-[46ch]">
            Hesap açmak otuz saniye sürer; kredi kartı istemem. Sorun varsa
            bana doğrudan yazabilirsin.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            {kullanici ? (
              <Link href="/panel" className="v-btn">
                Panele git <span aria-hidden>→</span>
              </Link>
            ) : (
              <Link href="/kayit" className="v-btn">
                Ücretsiz başla <span aria-hidden>→</span>
              </Link>
            )}
            <a href="mailto:destek@zihnora.com.tr" className="v-btn v-btn-ghost">
              Bana yaz
            </a>
          </div>
          <p className="mt-8 text-[12px] text-[#7d7d86]">
            15 dakikalık kurulum görüşmesi istersen{" "}
            <Link href="/iletisim" className="underline underline-offset-4 hover:text-[#b9b9c0]">
              iletişim sayfasından
            </Link>{" "}
            ulaş.
          </p>
        </div>
      </section>
    </main>
  );
}
