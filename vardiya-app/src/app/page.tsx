import Link from "next/link";

const steps = [
  {
    n: "1",
    title: "Personeli ekle",
    text: "İsim, görev ve telefon. Hepsi bu — dakikalar içinde hazır.",
  },
  {
    n: "2",
    title: "Vardiyayı planla",
    text: "Hazır şablonlarla haftayı doldur. 45 saati aşanı kırmızıyla gör.",
  },
  {
    n: "3",
    title: "WhatsApp'tan gönder",
    text: "Personele uygulama indirtmeden tek tıkla programını yolla.",
  },
];

const features = [
  { icon: "🗓️", title: "Haftalık ızgara", text: "Personel × gün; süratle doldur, toplam saati anında gör." },
  { icon: "📲", title: "WhatsApp gönderimi", text: "Tek tık ya da tüm ekibe birden. Uygulama indirmeye gerek yok." },
  { icon: "⚖️", title: "Mevzuat uyarısı", text: "Haftalık 45 saat sınırını aşanı otomatik işaretler." },
  { icon: "💰", title: "Maliyet tahmini", text: "Saatlik ücret × saat = haftalık işçilik maliyeti." },
  { icon: "🧑‍🍳", title: "Personel görünümü", text: "Çalışan kendi programını görür, izin talebi gönderir." },
  { icon: "🖨️", title: "Yazdırılabilir çizelge", text: "Duvara asılacak temiz haftalık çizelge." },
];

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 text-center">
        <span className="inline-block rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
          Kafe &amp; restoranlar için
        </span>
        <h1 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-tight text-balance">
          Vardiyayı <span className="text-amber-600">Excel ve WhatsApp</span> yerine
          <br className="hidden sm:block" /> 5 dakikada planla
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-600">
          Personele tek tıkla WhatsApp&apos;tan gönder. <strong>Eğitim yok, karmaşa yok.</strong>
        </p>
        <p className="mt-3 text-sm text-zinc-500">PDKS yok · Bordro yok · Sadece vardiya</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/basla"
            className="rounded-lg bg-zinc-900 px-6 py-3 text-white font-medium hover:bg-zinc-700 transition-colors"
          >
            90 saniyede kur →
          </Link>
          <Link
            href="/panel"
            className="rounded-lg border border-zinc-300 bg-white px-6 py-3 font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            Panele Git
          </Link>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                {s.n}
              </div>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-zinc-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Özellikler */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          İşletmenin ihtiyacı olan her şey
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-zinc-600">{f.text}</p>
            </div>
          ))}
        </div>

        {/* Fiyatlandırma — sadece iki paket */}
      <section className="mx-auto max-w-4xl px-4 pb-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight">Basit fiyat</h2>
        <p className="mt-2 text-center text-zinc-600">
          İki paket. Gizli ücret yok, uzun taahhüt yok.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Ücretsiz</h3>
            <div className="mt-2 text-3xl font-semibold">
              ₺0
            </div>
            <p className="text-sm text-zinc-500">5 çalışana kadar</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600">
              <li>✓ Haftalık vardiya planı</li>
              <li>✓ WhatsApp&apos;tan gönder</li>
              <li>✓ 45 saat / mevzuat uyarısı</li>
              <li>✓ Yazdırılabilir çizelge</li>
            </ul>
            <Link
              href="/basla"
              className="mt-6 block rounded-lg border border-zinc-300 py-2.5 text-center font-medium hover:bg-zinc-100"
            >
              Ücretsiz başla
            </Link>
          </div>
          <div className="rounded-2xl border-2 border-zinc-900 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pro</h3>
              <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] text-white">
                Önerilen
              </span>
            </div>
            <div className="mt-2 text-3xl font-semibold">
              ₺399<span className="text-base font-normal text-zinc-500">/ay</span>
            </div>
            <p className="text-sm text-zinc-500">Lokasyon başına · sınırsız çalışan</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600">
              <li>✓ Ücretsiz paketteki her şey</li>
              <li>✓ Sınırsız personel</li>
              <li>✓ Personel görünümü + izin talepleri</li>
              <li>✓ Excel (CSV) dışa aktarım</li>
              <li>✓ Öncelikli destek + kurulum yardımı</li>
            </ul>
            <Link
              href="/basla"
              className="mt-6 block rounded-lg bg-zinc-900 py-2.5 text-center font-medium text-white hover:bg-zinc-700"
            >
              Pro&apos;ya başla
            </Link>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-zinc-400">
          Fiyat bir hipotezdir; pilot müşteriyle netleşecek. Yıllık ödemede %20 indirim.
        </p>
      </section>

      <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          <strong>Bu bir MVP.</strong> Veriler sunucudaki veritabanında (SQLite) saklanır; panele
          eklediğin personel anında kaydedilir. Gerçek pilot müşteriyle test edip geri bildirime
          göre geliştiriyoruz.
        </div>
      </section>
    </main>
  );
}
