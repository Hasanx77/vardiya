import Link from "next/link";
import { aktifKullanici } from "@/lib/auth";
import HesapSilButonu from "@/components/HesapSilButonu";
import { kaydetZiyaret } from "@/lib/visits";
import { AYDINLATMA_SURUMU, aydinlatmaOnayi } from "@/lib/kvkk";

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
  const onay = kullanici ? await aydinlatmaOnayi(kullanici.id) : null;

  return (
    <main className="flex-1">
      <div className="sayfa max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
          Gizlilik
        </p>
        <h1 className="sayfa-baslik mt-1">Gizlilik ve KVKK Aydınlatması</h1>
        <p className="sayfa-alt">
          Sürüm 2026-10-30 · Son güncelleme: 30 Ekim 2026
        </p>

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
            <li>
              <strong>İletişim mesajları:</strong> iletişim formunu kullandığında adın,
              e-posta adresin ve mesaj metnin kaydedilir. Amaç yalnızca talebini
              yanıtlamaktır; pazarlama listesine eklenmez, üçüncü tarafla paylaşılmaz.
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

          <h2 className="pt-3 text-lg font-semibold text-zinc-900">4) Nerede, neden ve kim tarafından saklanır?</h2>
          <p>
            Veriler, Türkiye&apos;deki barındırma sunucusunda (Hosting Dünyam) her işletmeye ait
            ayrı kayıtlar hâlinde (işletme kimliğiyle izole) tutulur. Uygulama verileri
            yurt dışına aktarılmaz; yalnızca <strong>destek e-postası</strong> Google
            (ABD) altyapısı üzerinden yürütülebilir. İşleme amacı tek:
            vardiya planını oluşturmanı sağlamak ve çizelgeyi ekibine iletebilmek.
          </p>
          <p className="mt-2">
            <strong>Roller:</strong> Personel verileri için <strong>veri sorumlusu işletme</strong>
            (hesabı açan işveren), <strong>veri işleyen ise Vardiya</strong> (barındırma ve yazılım
            altyapısı) konumundadır. Personeline verebileceğin örnek aydınlatma metni{" "}
            <Link href="/personel-aydinlatma" className="underline">
              /personel-aydinlatma
            </Link>{" "}
            sayfasındadır; bu metin hukuki danışmanlık değildir.
          </p>

          <h2 className="pt-3 text-lg font-semibold text-zinc-900">5) Güvenlik</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Şifreler <strong>scrypt</strong> ile tuzlanıp özetlenir; düz metin şifre hiçbir yerde saklanmaz.</li>
            <li>Oturum çerezi <strong>HMAC-SHA256</strong> ile imzalanır; değiştirilirse geçersiz olur.</li>
            <li>Tüm trafik <strong>HTTPS</strong> üzerinden şifrelenir (Let&apos;s Encrypt sertifikası).</li>
            <li><strong>Hesap izolasyonu:</strong> her hesap yalnızca kendi işletmesinin verisini okuyabilir.</li>
          </ul>

          <h2 className="pt-3 text-lg font-semibold text-zinc-900">6) Saklama süreleri</h2>
          <p>
            Her veri türü yalnızca işi için gereken süre kadar durur; süre
            dolunca silinir. Hesabını sildiğinde işletme ve ona bağlı tüm
            kayıtlar (personel, vardiyalar, duyurular, notlar) veritabanından
            <strong> kalıcı olarak</strong> silinir.
          </p>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500">
                  <th className="py-2 pr-4 font-semibold">Veri</th>
                  <th className="py-2 pr-4 font-semibold">Saklama</th>
                  <th className="py-2 font-semibold">Sonrası</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-100">
                  <td className="py-2 pr-4">Hesap, işletme, personel, plan</td>
                  <td className="py-2 pr-4">Sen silene kadar</td>
                  <td className="py-2">Kalıcı silinir</td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="py-2 pr-4">Aydınlatma onay kaydı</td>
                  <td className="py-2 pr-4">12 ay</td>
                  <td className="py-2">Otomatik silinir</td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="py-2 pr-4">Ziyaret sayacı (tuzlu özet)</td>
                  <td className="py-2 pr-4">120 gün</td>
                  <td className="py-2">Otomatik silinir</td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="py-2 pr-4">İletişim formu mesajları</td>
                  <td className="py-2 pr-4">En çok 12 ay</td>
                  <td className="py-2">Otomatik silinir</td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="py-2 pr-4">Sunucu yedeği (şifreli arşiv)</td>
                  <td className="py-2 pr-4">14 gün, döner</td>
                  <td className="py-2">Yeni yedek eskisini iter</td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="py-2 pr-4">Erişim/hata günlükleri</td>
                  <td className="py-2 pr-4">En çok 30 gün</td>
                  <td className="py-2">Silinir; içerik toplanmaz</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="pt-3 text-lg font-semibold text-zinc-900">7) Kimlerle paylaşılır?</h2>
          <p>
            Veri satılmaz, reklam amacıyla paylaşılmaz. Yalnızca hizmeti
            ayakta tutan <strong>alt işleyenler</strong> veriye erişebilir ve
            hepsi sözleşmeyle sınırlıdır:
          </p>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500">
                  <th className="py-2 pr-4 font-semibold">Alt işleyen</th>
                  <th className="py-2 pr-4 font-semibold">Amaç</th>
                  <th className="py-2 font-semibold">Konum</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-100">
                  <td className="py-2 pr-4">Hosting Dünyam (barındırma)</td>
                  <td className="py-2 pr-4">Sunucu, disk, yedek</td>
                  <td className="py-2">Türkiye</td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="py-2 pr-4">E-posta sunucusu (kendi SMTP)</td>
                  <td className="py-2 pr-4">Şifre sıfırlama, doğrulama, plan PDF</td>
                  <td className="py-2">Türkiye</td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="py-2 pr-4">Google (yalnızca istersen)</td>
                  <td className="py-2 pr-4">&quot;Google ile giriş&quot; kullanırsan kimlik doğrulama</td>
                  <td className="py-2">ABD — yurt dışı aktarım</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="pt-1 text-zinc-600">
            Google ile giriş <strong>isteğe bağlıdır</strong>; kullanmazsan
            verin yurt dışına çıkmaz. Google ile girişte yalnızca e-posta ve
            doğrulanmış kimlik bilgisi alınır; kişiler, takvim veya dosyalarına
            erişilmez. Veri işleyen sözleşmesinin bir kopyasını destek
            adresinden isteyebilirsin.
          </p>

          <h2 className="pt-3 text-lg font-semibold text-zinc-900">8) Veri ihlali olursa</h2>
          <p>
            Veriye yetkisiz erişim, sızıntı veya kayıp tespit edilirse süreç
            yazılı bir plana göre yürür: olay <strong>derhal</strong> kayda
            alınır, etki alanı ve etkilenen kişiler belirlenir, sızıntı
            kapatılır. Kişisel Verileri Koruma Kurulu&apos;na{" "}
            <strong>72 saat içinde</strong>, etkilenen kişilere ise{" "}
            <strong>makul en kısa sürede</strong> bildirim yapılır. Etkilenen
            hesapların tüm oturumları kapatılır ve şifre değişikliği istenir.
          </p>
          <p className="text-zinc-600">
            Şüpheli bir durum görürsen{" "}
            <a href="mailto:destek@zihnora.com.tr" className="underline">
              destek@zihnora.com.tr
            </a>{" "}
            adresine yaz; bildirimin 24 saat içinde yanıtlanır.
          </p>

          <h2 className="pt-3 text-lg font-semibold text-zinc-900">9) VERBİS ve kayıt yükümlülüğü</h2>
          <p>
            Veri Sorumluları Sicili (VERBİS) kayıt yükümlülüğü, Kurul&apos;un
            belirlediği yıllık çalışan sayısı ve mali bilanço eşiklerine
            bağlıdır; eşik altında kalındığı sürece kayıt gerekmez. Eşik
            aşılırsa kayıt yapılır ve bu sayfada duyurulur. Eşik kapsamı dışında
            kalsak da bu aydınlatma metni, saklama politikası ve veri işleme
            envanteri güncel tutulur.
          </p>

          <h2 className="pt-3 text-lg font-semibold text-zinc-900">10) Haklarınız (KVKK m.11)</h2>
          <p>
            Verilerinin işlenip işlenmediğini öğrenme, düzeltilmesini isteme, silinmesini (unutulma)
            ve taşınabilirliğini talep etme hakkın var. Verini JSON olarak indirme ve hesabını
            silme düğmeleri aşağıdadır; diğer talepler için destek adresine yazabilirsin.
          </p>
          <p className="text-sm text-zinc-600">
            İndirilen JSON dosyası hesabına ve işletmene bağlı verileri içerir. İletişim formundan
            gönderdiğin mesajlar bu dosyada yer almaz (onları yalnızca site sahibi görür); kopyasını
            destek adresinden talep edebilirsin.
          </p>
        </section>

        {kullanici ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-600">
              Giriş yapmış hesap: <strong>{kullanici.email}</strong>
            </p>
            <p className="mt-1 text-[12px] text-zinc-500">
              {onay
                ? `Aydınlatma onayın kayıtlı: ${new Date(onay.zaman).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} · sürüm ${onay.surum}`
                : "Bu hesap için kayıtlı onay bulunamadı (Google ile giriş yapılmış olabilir)."}
              {onay && onay.surum !== AYDINLATMA_SURUMU
                ? " — metin güncellendi, yeni sürümü okuman önerilir."
                : ""}
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
          <h2 className="text-lg font-semibold text-zinc-900">11) İletişim</h2>
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
            Not: Bu sayfa bir bilgilendirmedir. İşletme ve personel verilerinde veri
            sorumlusu hesabı açan işletme; barındırma ve yazılım altyapısında Vardiya
            veri işleyendir. Personeline verilecek örnek metin{" "}
            <Link href="/personel-aydinlatma" className="underline">
              personel aydınlatma metni örneğinde
            </Link>
            dir.
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
