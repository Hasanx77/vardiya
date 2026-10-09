import Link from "next/link";

export const metadata = {
  title: "Yardım — Vardiya",
  description: "Vardiya uygulaması nasıl kullanılır? Adım adım kılavuz.",
};

const sections: { id: string; title: string; items: string[] }[] = [
  {
    id: "baslangic",
    title: "🚀 Başlangıç",
    items: [
      "İşletme adını yaz ve personelini toplu yapıştır (Ad; Görev; Telefon).",
      "Vardiya şablonları (Sabah/Akşam/Tam Gün) otomatik hazır gelir.",
      "İlk günü geçen haftadan kopyalayarak hızlıca doldurabilirsin.",
    ],
  },
  {
    id: "panel",
    title: "🗓️ Yönetim Paneli",
    items: [
      "Haftalık ızgarada her hücreye tıklayıp vardiya seç.",
      "Gün başlığındaki '＋ not' ile o güne not ekle (ör. canlı müzik).",
      "Şablonları Yönet'ten vardiya ekle/düzenle ve 'min. kişi' hedefini belirle.",
      "Kapsam uyarıları: hedefin altında kalan gün/vardiyalar kendiliğinden listelenir.",
      "'Tümüne Gönder' ile herkese WhatsApp'tan programını yolla.",
    ],
  },
  {
    id: "personel",
    title: "🧑 Personel Görünümü (salt-okunur)",
    items: [
      "Çalışan yalnızca kendi haftalık programını görür.",
      "İzin hakkı ve duyurular görünür.",
      "'Telefon takvimine ekle (.ics)' ile programını cebine alır.",
      "Elemanın veri değiştirebileceği bir alan yoktur.",
    ],
  },
  {
    id: "diger",
    title: "🧰 Diğer",
    items: [
      "Bugün: kafede tablete açılabilecek 'bugün kim çalışıyor' tahtası.",
      "Raporlar: aylık saat / maliyet / izin özeti + CSV.",
      "Yazdır: duvara asılacak haftalık çizelge.",
      "Sağ üstteki 🌙/☀️ ile koyu/açık tema.",
    ],
  },
];

export default function YardimPage() {
  return (
    <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Yardım Kılavuzu</h1>
      <p className="mt-2 text-zinc-600">
        Vardiya&apos;yı 5 dakikada öğren. Aşağıdaki adımlar işini görür.
      </p>

      <div className="mt-8 space-y-8">
        {sections.map((s) => (
          <section key={s.id} id={s.id}>
            <h2 className="text-xl font-semibold">{s.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-700">
              {s.items.map((it, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
        Sorun mu var? Panele dönüp <strong>Ayarlar → Örnek veriye dön</strong> ile demo verisini
        yeniden yükleyebilirsin. İşletmeni sıfırdan kurmak için{" "}
        <Link href="/basla" className="text-zinc-900 underline">
          /basla
        </Link>{" "}
        sayfasını kullan.
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href="/panel"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Panele Git →
        </Link>
        <Link
          href="/gizlilik"
          className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100"
        >
          Gizlilik
        </Link>
      </div>
    </main>
  );
}
