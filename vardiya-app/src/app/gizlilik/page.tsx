import Link from "next/link";
import { aktifKullanici } from "@/lib/auth";
import HesapSilButonu from "@/components/HesapSilButonu";
import { kaydetZiyaret } from "@/lib/visits";

export const metadata = {
  title: "Gizlilik ve KVKK Aydınlatması — Vardiya",
  description:
    "Vardiya'da hangi veriler işlenir, nerede saklanır, nasıl korunur ve haklarınızı nasıl kullanırsınız.",
  alternates: { canonical: "/gizlilik" },
};

export const dynamic = "force-dynamic";

/**
 * Gizlilik sayfası.
 * Hesap açıksa "verilerimi indir / hesabımı sil" düğmeleri görünür (taşınabilirlik + unutulma hakkı).
 */
export default async function GizlilikPage() {
  const kullanici = await aktifKullanici();
  await kaydetZiyaret();

  return (
    <main className="flex-1">
      <div className="sayfa max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
          Gizlilik
        </p>
        <h1 className="sayfa-baslik mt-1">Gizlilik ve KVKK Aydınlatması</h1>
        <p className="sayfa-alt">Son güncelleme: 19 Ekim 2026</p>

        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <strong>Özet:</strong> Vardiya yalnızca işini yapmak için gereken veriyi toplar. Reklam
          yok, takip yok, veri satışı yok. Üçüncü taraf analitik yok; yalnızca kendi
          sunucumuzda çalışan, çerez kullanmayan bir ziyaret sayacı var. Veriler
          Türkiye&apos;deki sunucuda tutulur; dilediğin an indirip silebilirsin.
        </div>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900">1) Hangi veriler işlenir?</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Hesap:</strong> e-posta adresi, şifrenin geri döndürülemez özeti (hash), hesap oluşturma ve son giriş zamanı.</li>
            <li><strong>İşletme:</strong> işletme adı, vardiya şablonları (saat/renk).</li>
            <li><strong>Personel kayıtları:</strong> ad, telefon, görev, yıllık izin hakkı — <em>senin girdiğin kadarıyla</em>. (Ücret/maaş bilgisi <strong>istenmez ve saklanmaz</strong>.)</li>
            <li><strong>Planlama:</strong> vardiya atamaları, duyurular, gün notları.</li>
            <li>
              <strong>Ziyaret sayacı:</strong> çerez kullanılmaz; IP adresi ve tarayıcı
              bilgisi <strong>saklanmaz</strong>. Yalnızca günlük tuzlu bir özet (hash) ve
              tarih tutulur; 120 gün sonra silinir. Kişisel profil oluşturmak için
              kullanılmaz.
            </li>
          </ul>

          <h2 className="pt-3 text-lg font-semibold text-zinc-900">2) İşlenmeyen veriler</h2>
          <p>
            T.C. kimlik numarası, konum, ödeme/kredi kartı bilgisi, cihaz parmak izi, reklam kimliği
            <strong> toplanmaz</strong>. Üçüncü taraf analitik betiği, reklam pikseli veya çerez
            kullanılmaz. Tarayıcıda yalnızca <strong>giriş için gerekli tek çerez</strong> bulunur;
            ziyaret sayacı çerez kullanmaz ve ham IP saklamaz.
          </p>

          <h2 id="cerezler" className="scroll-mt-20 pt-3 text-lg font-semibold text-zinc-900">3) Çerezler</h2>
          <p>
            Vardiya&apos;da reklam, takip veya üçüncü taraf çerezi <strong>yoktur</strong>.
            Tarayıcıda yalnızca giriş yaptığında oluşan <strong>tek bir zorunlu çerez</strong>
            bulunur:
          </p>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500">
                  <th className="py-2 pr-4 font-semibold">Çerez</th>
                  <th className="py-2 pr-4 font-semibold">Amaç</th>
                  <th className="py-2 pr-4 font-semibold">Süre</th>
                  <th className="py-2 font-semibold">Tür</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-100">
                  <td className="py-2 pr-4 font-mono text-xs">vardiya_oturum</td>
                  <td className="py-2 pr-4">Oturumun açık kalması (imzalı, httpOnly)</td>
                  <td className="py-2 pr-4">30 gün</td>
                  <td className="py-2">Zorunlu</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="pt-1 text-zinc-600">
            Bu çerez olmadan giriş yapılamaz; bu yüzden onay penceresi (çerez bandı)
            gösterilmez. Tema tercihi çerez değil, tarayıcının <em>localStorage</em>
            alanında tutulur ve sunucuya gönderilmez. Ziyaret sayacı da çerez kullanmaz.
          </p>

          <h2 className="pt-3 text-lg font-semibold text-zinc-900">4) Nerede ve neden saklanır?</h2>
          <p>
            Veriler, Türkiye&apos;deki barındırma sunucusunda (Hosting Dünyam) işletmeye özel bir
            veritabanında tutulur ve <strong>yurt dışına aktarılmaz</strong>. İşleme amacı tek:
            vardiya planını oluşturmanı sağlamak ve çizelgeyi ekibine iletebilmen.
          </p>

          <h2 className="pt-3 text-lg font-semibold text-zinc-900">5) Güvenlik</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Şifreler <strong>scrypt</strong> ile tuzlanıp özetlenir; düz metin şifre hiçbir yerde saklanmaz.</li>
            <li>Oturum çerezi <strong>HMAC-SHA256</strong> ile imzalanır; değiştirilirse geçersiz olur.</li>
            <li>Tüm trafik <strong>HTTPS</strong> üzerinden şifrelenir (Let&apos;s Encrypt sertifikası).</li>
            <li><strong>Hesap izolasyonu:</strong> her hesap yalnızca kendi işletmesinin verisini okuyabilir.</li>
          </ul>

          <h2 className="pt-3 text-lg font-semibold text-zinc-900">6) Saklama süresi</h2>
          <p>
            Veriler, sen silene kadar saklanır. Hesabını sildiğinde işletme ve ona bağlı tüm kayıtlar
            (personel, vardiyalar, duyurular, notlar) veritabanından <strong>kalıcı olarak</strong> silinir.
            Ziyaret sayacı kayıtları ise <strong>120 gün</strong> sonra otomatik olarak silinir.
          </p>

          <h2 className="pt-3 text-lg font-semibold text-zinc-900">7) Haklarınız (KVKK m.11)</h2>
          <p>
            Verilerinin işlenip işlenmediğini öğrenme, düzeltilmesini isteme, silinmesini (unutulma)
            ve taşınabilirliğini talep etme hakkın var. İlk ikisi uygulama içinde tek tıkla kullanılabilir:
          </p>
        </section>

        {kullanici ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-600">
              Giriş yapmış hesap: <strong>{kullanici.email}</strong>
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/api/hesap/veri"
                className="btn-birincil"
              >
                Verilerimi indir (JSON)
              </a>
              <HesapSilButonu />
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
            Verilerini indirmek veya hesabını silmek için{" "}
            <Link href="/giris" className="font-medium text-zinc-900 underline">
              giriş yap
            </Link>
            .
          </div>
        )}

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900">8) İletişim</h2>
          <p>
            Soru, talep veya şikâyet için:{" "}
            <a href="mailto:destek@zihnora.com.tr" className="underline">
              destek@zihnora.com.tr
            </a>{" "}
            veya{" "}
            <Link href="/iletisim" className="underline">
              iletişim formu
            </Link>
            . Talebini en geç 30 gün içinde yanıtlarız.
          </p>
          <p className="text-xs text-zinc-500">
            Not: Bu sayfa bir bilgilendirmedir; veri sorumlusu olarak uygulama sahibi hareket eder.
          </p>
        </section>

        <p className="mt-8 text-sm">
          <Link href="/" className="underline hover:text-zinc-900">
            ← Tanıtım sayfasına dön
          </Link>
        </p>
      </div>
    </main>
  );
}
