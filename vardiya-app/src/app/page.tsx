import Link from "next/link";

const features = [
  {
    icon: "⚡",
    title: "5 dakikada plan",
    text: "Hazır Sabah / Akşam / Tam Gün şablonlarıyla haftalık vardiyayı tek ekranda kur.",
  },
  {
    icon: "📲",
    title: "WhatsApp ile gönder",
    text: "Personele uygulama indirtmeye gerek yok. Tek tıkla kendi programını WhatsApp'tan alsın.",
  },
  {
    icon: "⚖️",
    title: "Mevzuat uyarısı",
    text: "Haftalık 45 saat sınırını aşan personeli otomatik kırmızıyla işaretler.",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 text-center">
        <span className="inline-block rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
          Kafe & restoranlar için
        </span>
        <h1 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-tight text-balance">
          Vardiyayı <span className="text-amber-600">Excel ve WhatsApp</span> yerine
          <br className="hidden sm:block" /> 5 dakikada planla
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-600">
          Personeline tek tıkla WhatsApp&apos;tan gönder. Türkçe, mevzuata uygun, cebinde.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/panel"
            className="rounded-lg bg-zinc-900 px-6 py-3 text-white font-medium hover:bg-zinc-700 transition-colors"
          >
            Panele Git →
          </Link>
          <a
            href="#nasil"
            className="rounded-lg border border-zinc-300 bg-white px-6 py-3 font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            Nasıl çalışır?
          </a>
        </div>
      </section>

      {/* Özellikler */}
      <section id="nasil" className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-zinc-600">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          <strong>Bu bir MVP.</strong> Veriler şimdilik tarayıcında saklanır. Gerçek pilot
          müşteriyle test edip geri bildirime göre geliştireceğiz.
        </div>
      </section>
    </main>
  );
}
