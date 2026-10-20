import type { Metadata } from "next";
import Link from "next/link";
import { kaydetZiyaret } from "@/lib/visits";

export const metadata: Metadata = {
  title: "Personel Aydınlatma Metni Örneği — Vardiya",
  description:
    "Vardiya kullanan işletmelerin personeline verebileceği KVKK aydınlatma metni örneği. Veri sorumlusu işletme, veri işleyen Vardiya.",
  alternates: { canonical: "/personel-aydinlatma" },
  openGraph: {
    title: "Personel Aydınlatma Metni Örneği — Vardiya",
    description:
      "İşletmenin personeline verebileceği örnek KVKK aydınlatma metni ve veri sorumlusu/veri işleyen rolleri.",
    url: "/personel-aydinlatma",
    type: "article",
  },
};

export const dynamic = "force-dynamic";

/**
 * İşletmelerin personeline verebileceği örnek aydınlatma metni.
 * Hukuki danışmanlık değildir; işletme kendi bilgileriyle uyarlamalıdır.
 */
export default async function PersonelAydinlatmaPage() {
  await kaydetZiyaret();

  return (
    <main className="flex-1">
      <div className="kap py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
            KVKK
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] text-zinc-900 sm:text-4xl">
            Personel aydınlatma metni örneği
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-zinc-600">
            Vardiya&apos;yı kullanan işletmelerin çalışanlarına verebileceği örnek
            metin. Bu bir hukuki danışmanlık değildir; işletme adı, iletişim
            bilgisi ve kendi süreçlerinize göre uyarlamanız gerekir.
          </p>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
            <strong>Roller:</strong> Personel verileri için <strong>veri sorumlusu
            işletme</strong> (işveren), <strong>veri işleyen ise Vardiya</strong>{" "}
            (ürün sahibi; barındırma ve yazılım altyapısı). Çalışan, talebini
            öncelikle kendi işverenine iletir.
          </div>

          <article className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700">
            <section>
              <h2 className="text-lg font-semibold text-zinc-900">
                1. Veri sorumlusu
              </h2>
              <p className="mt-2">
                [İşletme Adı] (“İşletme”), 6698 sayılı Kişisel Verilerin Korunması
                Kanunu kapsamında çalışanlarının kişisel verileri bakımından veri
                sorumlusudur. İletişim: [adres] · [e-posta] · [telefon].
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">
                2. İşlenen veriler
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Ad soyad, görev/unvan, telefon numarası (isteğe bağlı).</li>
                <li>Haftalık vardiya atamaları, çalışma günleri ve saatleri.</li>
                <li>Yıllık izin hakkı (gün) ve varsa işletmenin girdiği kısa notlar.</li>
              </ul>
              <p className="mt-2">
                Vardiya uygulamasında <strong>ücret, maaş, banka, T.C. kimlik
                numarası, konum veya sağlık verisi istenmez ve saklanmaz</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">
                3. İşleme amaçları
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Haftalık vardiya planının hazırlanması ve çalışana iletilmesi.</li>
                <li>Çalışma sürelerinin ve dinlenme aralıklarının planlanması.</li>
                <li>Aylık çalışma özeti ve işletme içi raporlama.</li>
                <li>Çalışanın kendi programını giriş yapmadan görüntüleyebilmesi.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">
                4. Hukuki sebep
              </h2>
              <p className="mt-2">
                Veriler, iş sözleşmesinin kurulması/ifası (KVKK m.5/2-c) ve
                işletmenin meşru menfaati (m.5/2-f) kapsamında işlenir. İşletme,
                kendi faaliyetine özel hukuki değerlendirmeyi yapmalıdır.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">
                5. Aktarım ve saklama
              </h2>
              <p className="mt-2">
                Veriler Türkiye&apos;deki barındırma sunucusunda tutulur ve yurt
                dışına aktarılmaz. Yazılım altyapısı için Vardiya (ürün sahibi) veri
                işleyen olarak hizmet verir. Üçüncü taraf reklam veya analitik
                hizmeti kullanılmaz. Veriler, işletme hesabı silinene kadar
                saklanır; hesap silindiğinde işletme ve bağlı personel kayıtları
                kalıcı olarak silinir. Barındırma sağlayıcısının haftalık yedeği
                en fazla 7 gün tutulur.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">
                6. Çalışanın hakları (KVKK m.11)
              </h2>
              <p className="mt-2">
                Çalışan; verilerinin işlenip işlenmediğini öğrenme, düzeltilmesini,
                silinmesini veya anonim hâle getirilmesini isteme, aktarıldığı
                üçüncü kişileri öğrenme ve zararın giderilmesini talep etme
                hakkına sahiptir. Talepler işletmenin yukarıdaki iletişim
                kanalına iletilir. İşletme, talebi en geç 30 gün içinde
                yanıtlamalıdır.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">
                7. WhatsApp ve personel linki
              </h2>
              <p className="mt-2">
                İşletme, çalışana WhatsApp üzerinden program gönderebilir. Bu
                durumda mesaj, çalışanın kendi WhatsApp uygulaması üzerinden
                iletilir; Vardiya otomatik mesaj göndermez. Personel linki,
                giriş gerektirmeden yalnızca o çalışanın programını gösterir;
                linkte telefon numarası ve diğer çalışanların bilgileri yer
                almaz. Linki bilen üçüncü kişiler programı görebilir; işletme
                personeli sildiğinde link geçersiz olur.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">
                8. Sorumluluk notu
              </h2>
              <p className="mt-2">
                Bu metin örnektir; hukuki danışmanlık değildir. İşletme, kendi
                veri işleme faaliyetlerine göre metni uyarlamak ve gerekli
                aydınlatma/veri işleyen sözleşmesi adımlarını almakla
                yükümlüdür. Vardiya yalnızca teknik altyapıyı sağlar.
              </p>
            </section>
          </article>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link href="/gizlilik" className="btn-birincil">
              Gizlilik ve KVKK
            </Link>
            <Link href="/iletisim" className="btn-ikincil">
              Soru sor
            </Link>
            <Link href="/" className="btn-ghost">
              Ana sayfa
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
