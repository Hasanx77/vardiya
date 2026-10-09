import Link from "next/link";

export const metadata = {
  title: "Gizlilik & KVKK — Vardiya",
  description: "Vardiya uygulamasında kişisel verilerin işlenmesine ilişkin bilgilendirme.",
};

export default function GizlilikPage() {
  return (
    <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Gizlilik & KVKK</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Son güncelleme: 9 Ekim 2026 · <strong>Şablon metindir</strong>, hukuki danışmanlık
        değildir. Yayına almadan önce kendi bilgilerinizle güncelleyin.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900">1. Veri Sorumlusu</h2>
          <p className="mt-2">
            Bu uygulama, işletme sahibi (veri sorumlusu) tarafından personel vardiya yönetimi
            amacıyla kullanılır. Veri sorumlusunun kimlik ve iletişim bilgileri buraya eklenmelidir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">2. İşlenen Kişisel Veriler</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Personel kimlik bilgileri: ad-soyad</li>
            <li>İletişim bilgisi: telefon numarası</li>
            <li>İş bilgileri: görev/pozisyon, vardiya planı, çalışma saatleri</li>
            <li>İnsan kaynakları bilgileri: yıllık izin hakkı/kullanımı, izin ve değişim talepleri</li>
            <li>Ücret bilgisi (opsiyonel): saatlik ücret (yalnızca maliyet tahmini için)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">3. İşleme Amaçları</h2>
          <p className="mt-2">
            Vardiya planlaması, çalışma sürelerinin ve izinlerin takibi, iş gücü maliyeti
            tahmini, personelin bilgilendirilmesi ve işletme içi iletişim.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">4. Aktarım</h2>
          <p className="mt-2">
            Uygulama, WhatsApp üzerinden mesaj gönderme özelliği sunar; gönderim personelin kendi
            cihazı/WhatsApp hesabı üzerinden gerçekleşir. Veriler, yasal zorunluluklar dışında
            üçüncü kişilerle paylaşılmaz.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">5. Saklama Süresi</h2>
          <p className="mt-2">
            Veriler, işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen asgari süreler
            boyunca saklanır; süre sonunda silinir veya anonim hale getirilir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">6. İlgili Kişinin Hakları (KVKK m.11)</h2>
          <p className="mt-2">
            Kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini
            veya silinmesini isteme ve işlemenin kısıtlanmasını talep etme gibi haklara sahipsiniz.
            Taleplerinizi veri sorumlusuna iletebilirsiniz.
          </p>
        </section>
      </div>

      <div className="mt-10 flex gap-3">
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100"
        >
          ← Ana sayfa
        </Link>
      </div>
    </main>
  );
}
