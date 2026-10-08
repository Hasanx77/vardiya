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
            href="/panel"
            className="rounded-lg bg-zinc-900 px-6 py-3 text-white font-medium hover:bg-zinc-700 transition-colors"
          >
            Panele Git →
          </Link>
          <Link
            href="/ekip"
            className="rounded-lg border border-zinc-300 bg-white px-6 py-3 font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            Personel Görünümü
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

        <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          <strong>Bu bir MVP.</strong> Veriler sunucudaki veritabanında (SQLite) saklanır; panele
          eklediğin personel anında kaydedilir. Gerçek pilot müşteriyle test edip geri bildirime
          göre geliştiriyoruz.
        </div>
      </section>
    </main>
  );
}
