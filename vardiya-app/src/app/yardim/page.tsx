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
    title: "Başlangıç",
    items: [
      "İşletme adını yaz ve personelini toplu yapıştır (Ad; Görev; Telefon).",
      "Excel'den hücreleri kopyalayıp yapıştırabilir veya .csv / .tsv / .txt dosyası yükleyebilirsin; başlık satırı otomatik atlanır.",
      "Vardiya şablonları (Sabah/Akşam/Tam Gün) otomatik hazır gelir.",
      "İlk günü geçen haftadan kopyalayarak hızlıca doldurabilirsin.",
    ],
  },
  {
    id: "demo",
    title: "Demo (kayıt gerekmez)",
    items: [
      "Ana sayfadaki 'Demoyu dene' bağlantısı /demo sayfasını açar.",
      "Hücrelere tıklayarak vardiya değiştirebilirsin; toplam saat ve uyarılar anında güncellenir.",
      "Demo, yaptığın değişiklikleri kaydetmez; gerçek hesabına dokunmaz.",
    ],
  },
  {
    id: "panel",
    title: "Yönetim Paneli",
    items: [
      "Haftalık ızgarada her hücreye tıklayıp vardiya seç.",
      "Plan hafta bazında yayınlanır: hazırlayıp 'Planı yayınla' dediğinde o hafta personel linkinde ve takvimde görünür. Yayınlanmayan hafta taslaktır, ekibe sızmaz.",
      "Yayından sonra düzenleme yaparsan 'Değişiklikleri yayınla' uyarısı çıkar; 'Yayını geri al' ile haftayı yeniden taslağa alabilirsin.",
      "Gün başlığındaki kalem simgesiyle o güne not ekle (ör. canlı müzik).",
      "Vardiya şablonlarını 'Yönet' düğmesinden düzenle; 'min. kişi' hedefini belirle. Bölünmüş vardiyada ara saatlerini de tanımlayabilirsin.",
      "Kapsam uyarıları: hedefin altında kalan gün/vardiyalar kendiliğinden listelenir.",
      "Gönder düğmesi her personele ayrı mesaj hazırlar; mesajları tek tek WhatsApp'ta açıp yollarsın.",
    ],
  },
  {
    id: "personel",
    title: "Personel Görünümü (salt-okunur)",
    items: [
      "Personel satırındaki 'Link' düğmesi kişiye özel bir bağlantı kopyalar.",
      "Çalışan bu bağlantıyı giriş yapmadan açar; yalnızca kendi haftalık programını görür.",
      "İzin hakkı ve duyurular görünür; telefon numarası ve diğer personelin bilgileri görünmez.",
      "'Telefon takvimine ekle (.ics)' ile programını cebine alır.",
      "Elemanın veri değiştirebileceği bir alan yoktur; linki bilen herkes programı görebilir. Panelde 'Linki yenile' eski bağlantıyı geçersiz kılar, 'Linki kapat' erişimi tamamen keser.",
    ],
  },
  {
    id: "whatsapp",
    title: "WhatsApp ve bildirim",
    items: [
      "Her personele ayrı mesaj hazırlanır; 15 kişilik ekipte 15 kez açılır. Otomatik toplu gönderim yoktur.",
      "WhatsApp Business API entegrasyonu yok; Vardiya senin adına mesaj göndermez.",
      "Plan değişince otomatik bildirim gitmez; güncel mesajı yeniden açıp yollaman gerekir.",
      "Personel linki her zaman son hâli gösterir; çalışan sayfayı yenilediğinde güncel programı görür.",
    ],
  },
  {
    id: "diger",
    title: "Diğer",
    items: [
      "Bugün: kafede tablete açılabilecek 'bugün kim çalışıyor' tahtası.",
      "Raporlar: aylık saat / izin özeti + CSV.",
      "Yazdır: duvara asılacak haftalık çizelge.",
      "Telefona ekle: tarayıcı menüsünden 'Ana Ekrana Ekle' ile uygulama gibi açılır (PWA). Mağaza uygulaması yok.",
      "Sağ üstteki tema düğmesiyle koyu/açık temaya geçebilirsin.",
    ],
  },
  {
    id: "sinirlar",
    title: "Bugünkü sınırlar (dürüst liste)",
    items: [
      "Tek hesap = tek işletme. Çok şubeli ekipler her şubeyi ayrı hesapla kullanabilir; tek panelden şube yönetimi ve 'müdür yalnız kendi şubesini görsün' yetkisi henüz yok.",
      "Müdür/çalışan yetkileri henüz yok; personel yalnızca kişisel bağlantısından salt-okunur programını görür.",
      "Uygulama içi vardiya değişim talebi, izin/mazeret girişi, okundu/onay bilgisi ve otomatik bildirim henüz yok.",
      "Haftalık 24 saat kesintisiz hafta tatili, fazla mesai ücreti, puantaj/bordro ve yıllık izin bakiye düşümü kapsam dışı. Aylık saat raporu CSV olarak indirilebilir.",
      "Bu özellikler yol haritasında; hazır olduklarında duyurulacak.",
    ],
  },
  {
    id: "kvkk",
    title: "KVKK ve veri sorumlusu",
    items: [
      "Personel verilerinde veri sorumlusu işletme (işveren), veri işleyen Vardiya'dır.",
      "Ücret/maaş, T.C. kimlik, konum ve sağlık verisi istenmez ve saklanmaz.",
      "Personeline verebileceğin örnek aydınlatma metni /personel-aydinlatma sayfasındadır; hukuki danışmanlık değildir.",
      "Verini profil sayfasından JSON olarak indirebilir, hesabını kalıcı olarak silebilirsin.",
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
        <strong>Mevzuat notu:</strong> Kontrol edilenler haftalık 45 saat ve
        günlük 11 saat (İş Kanunu 4857 m.63), iki vardiya arası 11 saat dinlenme
        (m.69), gece çalışmasında 7,5 saat (m.69), aynı gün çift vardiya ve
        2026–2027 tam gün resmî tatillerdir (2429 sayılı Kanun). Haftalık 24 saat
        kesintisiz hafta tatili, arife/yarım gün tatiller, fazla mesai ücreti,
        puantaj/bordro ve yıllık izin bakiye düşümü kapsam dışıdır. Uyarılar
        hukuki danışmanlık değildir; nihai plandan işveren sorumludur. Şüpheli
        durumlarda iş hukuku uzmanına veya mali müşavire danış.
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
        <Link href="/personel-aydinlatma" className="btn-ikincil">
          Personel aydınlatma örneği
        </Link>
      </div>
    </main>
  );
}
