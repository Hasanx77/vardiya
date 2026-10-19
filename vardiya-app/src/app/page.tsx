import Link from "next/link";

const adimlar = [
  {
    n: "1",
    title: "Personelini ekle",
    text: "İsim, görev, telefon. Tek tek ya da listeden yapıştırarak.",
  },
  {
    n: "2",
    title: "Haftayı doldur",
    text: "Hazır şablonlardan seç. 45 saati aşanı kırmızıyla gör.",
  },
  {
    n: "3",
    title: "WhatsApp'tan gönder",
    text: "Herkes kendi programını alır. Uygulama indirmesine gerek yok.",
  },
];

const ozellikler = [
  "Haftalık personel × gün ızgarası",
  "Tek tıkla WhatsApp gönderimi",
  "45 saat ve 11 saat dinlenme uyarısı",
  "Kim hangi gün çalışıyor?",
  "Personele salt-okunur program linki",
  "Yazdırılabilir haftalık çizelge",
];

const guvenceler = [
  {
    title: "Hesabına kilitli",
    text: "Her işletmenin verisi kendi hesabına bağlıdır; başka hesap göremez.",
  },
  {
    title: "İndir ve sil",
    text: "Tüm verini JSON olarak indir, hesabını tek tıkla kalıcı olarak sil.",
  },
  {
    title: "Reklam ve izleme yok",
    text: "Analitik betiği, reklam pikseli, üçüncü taraf çerezi kullanılmıyor.",
  },
  {
    title: "Türkiye'de barındırılıyor",
    text: "Kayıtlar yurt içindeki sunucuda tutulur; şifreler geri döndürülemez.",
  },
];

/** Mini çizelge görseli — tanıtım sayfasında ürünü göstermek için (etkileşimsiz). */
function OrnekCizelge() {
  const gunler = ["Pzt", "Sal", "Çar", "Per", "Cum"];
  const satirlar = [
    { ad: "Ayşe Y.", renk: "bg-amber-500", vardiyalar: ["Sabah", "Sabah", "—", "Sabah", "—"] },
    { ad: "Mehmet K.", renk: "bg-emerald-500", vardiyalar: ["Akşam", "Akşam", "Akşam", "—", "—"] },
    { ad: "Zeynep D.", renk: "bg-rose-500", vardiyalar: ["—", "—", "Tam gün", "—", "Sabah"] },
    { ad: "Can A.", renk: "bg-violet-500", vardiyalar: ["—", "—", "—", "Akşam", "Akşam"] },
  ];

  return (
    <div className="relative">
      <div
        aria-hidden
        className="hero-glow absolute -inset-6 -z-10 rounded-[2rem] blur-2xl"
      />
      <div className="kart overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <div>
            <div className="text-[13px] font-semibold">Haftalık plan</div>
            <div className="text-xs text-zinc-500">19 – 25 Ekim</div>
          </div>
          <span className="cip">4 kişi</span>
        </div>
        <div className="grid grid-cols-[72px_repeat(5,minmax(0,1fr))] gap-1 overflow-hidden px-2 py-3 text-[11px] sm:grid-cols-[86px_repeat(5,1fr)] sm:px-3">
          <div />
          {gunler.map((g) => (
            <div key={g} className="pb-1 text-center font-medium text-zinc-500">
              {g}
            </div>
          ))}
          {satirlar.map((s) => (
            <div key={s.ad} className="contents">
              <div className="flex min-w-0 items-center gap-1.5 py-1.5 text-[11px] font-medium text-zinc-700">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.renk}`} />
                <span className="truncate">{s.ad}</span>
              </div>
              {s.vardiyalar.map((v, i) => (
                <div
                  key={i}
                  className={`my-1 truncate rounded-md border px-1 py-1 text-center text-[10px] ${
                    v === "—"
                      ? "border-dashed border-zinc-200 text-zinc-300"
                      : v === "Sabah"
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : v === "Akşam"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : v === "Tam gün"
                            ? "border-rose-200 bg-rose-50 text-rose-800"
                            : "border-violet-200 bg-violet-50 text-violet-800"
                  }`}
                >
                  {v}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50 px-4 py-2 text-[11px] text-zinc-500">
          <span>Toplam 14 vardiya</span>
          <span className="font-medium text-emerald-700">✓ Mevzuata uygun</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div>
          <span className="cip">Kafe &amp; restoranlar için</span>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Haftalık vardiya planı,
            <br />
            <span className="text-amber-700">5 dakikada</span> hazır.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-600 sm:text-base">
            Personelini ekle, günleri doldur, tek tıkla WhatsApp&apos;tan gönder.
            Excel tablosu, kağıt liste ve mesaj karmaşası olmadan.
          </p>
          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <Link href="/kayit" className="btn-birincil h-11 px-6 text-sm">
              Ücretsiz hesap aç
            </Link>
            <Link href="/giris" className="btn-ikincil h-11 px-6 text-sm">
              Giriş yap
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            Kredi kartı yok · abonelik yok · reklam yok
          </p>
        </div>
        <OrnekCizelge />
      </section>

      {/* Üç adım */}
      <section id="nasil" className="border-y border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            {adimlar.map((s) => (
              <div key={s.n} className="flex gap-3.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-900 text-[13px] font-semibold text-white">
                  {s.n}
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Özellikler + neler yok */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">İhtiyacın olan her şey</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Fazlası değil. Vardiya planlamak için gereken altı şey, tek ekranda.
            </p>
            <ul className="mt-6 space-y-3">
              {ozellikler.map((o) => (
                <li key={o} className="flex items-start gap-2.5 text-sm text-zinc-700">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-[11px] text-emerald-700">
                    ✓
                  </span>
                  {o}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h3 className="text-[15px] font-semibold">Neler yok?</h3>
            <p className="mt-1 text-sm text-zinc-600">
              İşini zorlaştıran hiçbir şey yok. Bu bir vardiya aracı; başka bir şey değil.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600">
              <li className="flex items-center gap-2">
                <span className="text-zinc-400">—</span> PDKS / parmak izi
              </li>
              <li className="flex items-center gap-2">
                <span className="text-zinc-400">—</span> Bordro ve maaş hesabı
              </li>
              <li className="flex items-center gap-2">
                <span className="text-zinc-400">—</span> Ücret / maliyet takibi
              </li>
              <li className="flex items-center gap-2">
                <span className="text-zinc-400">—</span> Zorunlu eğitim, kurulum
              </li>
            </ul>
            <p className="mt-5 border-t border-zinc-100 pt-4 text-xs leading-relaxed text-zinc-500">
              Ücret bilgisi istenmez ve saklanmaz. Yalnızca kimin hangi gün çalıştığı
              tutulur.
            </p>
          </div>
        </div>
      </section>

      {/* Gizlilik */}
      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-semibold tracking-tight">Gelişmiş gizlilik</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Verin senin. Reklam yok, takip yok, kimseyle paylaşılmıyor.
          </p>
          <div className="mt-7 grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {guvenceler.map((g) => (
              <div key={g.title} className="flex gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-zinc-100 text-[11px] text-zinc-600">
                  ✓
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{g.title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-zinc-600">{g.text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm">
            <Link href="/gizlilik" className="font-medium underline underline-offset-2 hover:text-zinc-900">
              Gizlilik ve KVKK aydınlatmasını oku
            </Link>
          </p>
        </div>
      </section>

      {/* Son çağrı */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-amber-500 px-6 py-8 sm:flex-row sm:items-center sm:px-8">
          <div>
            <h2 className="text-xl font-semibold text-zinc-950 sm:text-2xl">
              Bu haftanın planı 5 dakika sonra hazır.
            </h2>
            <p className="mt-1.5 text-sm text-zinc-800">
              E-posta ile hesap aç; kredi kartı, deneme süresi veya kurulum yok.
            </p>
          </div>
          <Link
            href="/kayit"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-zinc-950 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Ücretsiz başla →
          </Link>
        </div>
      </section>
    </main>
  );
}
