import Link from "next/link";
import { kaydetZiyaret } from "@/lib/visits";

export const metadata = {
  title: "Yardım — Vardiya",
  description: "Vardiya uygulaması nasıl kullanılır? Adım adım kılavuz.",
  alternates: { canonical: "/yardim" },
};

export const dynamic = "force-dynamic";

const sections: { id: string; title: string; items: string[] }[] = [
  {
    id: "baslangic",
    title: "🚀 Başlangıç",
    items: [
      "İşletme adını yaz ve personelini toplu yapıştır (Ad; Görev; Telefon).",
      "Excel'den hücreleri kopyalayıp yapıştırabilir veya .csv / .tsv / .txt dosyası yükleyebilirsin; başlık satırı otomatik atlanır.",
      "Vardiya şablonları (Sabah/Akşam/Tam Gün) otomatik hazır gelir.",
      "İlk günü geçen haftadan kopyalayarak hızlıca doldurabilirsin.",
    ],
  },
  {
    id: "demo",
    title: "👀 Demo (kayıt gerekmez)",
    items: [
      "Ana sayfadaki 'Demoyu dene' bağlantısı /demo sayfasını açar.",
      "Hücrelere tıklayarak vardiya değiştirebilirsin; toplam saat ve uyarılar anında güncellenir.",
      "Demo hiçbir veri kaydetmez; gerçek hesabına dokunmaz.",
    ],
  },
  {
    id: "panel",
    title: "🗓️ Yönetim Paneli",
    items: [
      "Haftalık ızgarada her hücreye tıklayıp vardiya seç.",
      "Gün başlığındaki kalem simgesiyle o güne not ekle (ör. canlı müzik).",
      "Vardiya şablonlarını 'Yönet' düğmesinden düzenle; 'min. kişi' hedefini belirle.",
      "Kapsam uyarıları: hedefin altında kalan gün/vardiyalar kendiliğinden listelenir.",
      "Gönder düğmesiyle herkese WhatsApp'tan kendi programını yolla.",
    ],
  },
  {
    id: "personel",
    title: "🧑 Personel Görünümü (salt-okunur)",
    items: [
      "Personel satırındaki 'Link' düğmesi kişiye özel bir bağlantı kopyalar.",
      "Çalışan bu bağlantıyı giriş yapmadan açar; yalnızca kendi haftalık programını görür.",
      "İzin hakkı ve duyurular görünür.",
      "'Telefon takvimine ekle (.ics)' ile programını cebine alır.",
      "Elemanın veri değiştirebileceği bir alan yoktur; linki bilen herkes programı görebilir.",
    ],
  },
  {
    id: "diger",
    title: "🧰 Diğer",
    items: [
      "Bugün: kafede tablete açılabilecek 'bugün kim çalışıyor' tahtası.",
      "Raporlar: aylık saat / izin özeti + CSV.",
      "Yazdır: duvara asılacak haftalık çizelge.",
      "Sağ üstteki 🌙/☀️ ile koyu/açık tema.",
    ],
  },
  {
    id: "sinirlar",
    title: "🧭 Bugünkü sınırlar (dürüst liste)",
    items: [
      "Tek hesap = tek işletme. Çok şubeli ekipler her şubeyi ayrı hesapla kullanabilir; tek panelden şube yönetimi henüz yok.",
      "Müdür/çalışan yetkileri henüz yok; personel yalnızca kişisel bağlantısından salt-okunur programını görür.",
      "Uygulama içi vardiya değişim talebi, izin/mazeret girişi ve otomatik bildirim henüz yok. Talep WhatsApp'tan iletilir; plan değişince güncel programı tek tıkla gönderirsin.",
      "Bu özellikler yol haritasında; hazır olduklarında duyurulacak.",
    ],
  },
];

export default async function YardimPage() {
  await kaydetZiyaret();

  return (
    <main className="sayfa max-w-3xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
        Yardım
      </p>
      <h1 className="sayfa-baslik mt-1">Yardım kılavuzu</h1>
      <p className="sayfa-alt">
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

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
        <strong>Mevzuat notu:</strong> 45 saat, 11 saat dinlenme, gece çalışması
        ve resmî tatil uyarıları bir planlama kontrolüdür; hukuki danışmanlık
        değildir. Mevzuatın işletmene uygulanmasından işveren sorumludur.
        Şüpheli durumlarda iş hukuku uzmanına danış.
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
        Sorun mu var? Panele dönüp <strong>Ayarlar → Örnek veriyi yükle</strong> ile demo verisini
        yeniden yükleyebilirsin. İşletmeni sıfırdan kurmak için{" "}
        <Link href="/basla" className="text-zinc-900 underline">
          /basla
        </Link>{" "}
        sayfasını kullan. Cevap bulamadıysan{" "}
        <Link href="/iletisim" className="text-zinc-900 underline">
          bize yaz
        </Link>
        ; genellikle aynı gün dönüyoruz.
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/panel" className="btn-birincil">
          Panele git →
        </Link>
        <Link href="/demo" className="btn-ikincil">
          Demoyu dene
        </Link>
        <Link href="/gizlilik" className="btn-ikincil">
          Gizlilik
        </Link>
      </div>
    </main>
  );
}
