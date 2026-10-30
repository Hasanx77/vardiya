# KVKK Dosyası — Vardiya (zihnora.com.tr)

> Bu klasör, **6698 sayılı Kişisel Verilerin Korunması Kanunu** kapsamında
> tutulması gereken belgeleri bir arada tutar. Metinler hukuki danışmanlık
> değildir; bir avukatla gözden geçirilmesi önerilir. Amaç: denetim veya
> şikâyet hâlinde "ne yaptığını belgeleyebilmek".

## Belge listesi

| Belge | Ne zaman kullanılır |
| --- | --- |
| [`veri-isleme-envanteri.md`](veri-isleme-envanteri.md) | Hangi veri, hangi amaçla, ne kadar süre — VERBİS taslağı |
| [`saklama-ve-imha-politikasi.md`](saklama-ve-imha-politikasi.md) | Süre dolduğunda ne silinir, nasıl silinir |
| [`ihlal-mudahale-plani.md`](ihlal-mudahale-plani.md) | Veri ihlali şüphesinde ilk 72 saat |
| [`alt-isleyen-listesi.md`](alt-isleyen-listesi.md) | Barındırma/e-posta/Google — veri işleyen kayıtları |

## Roller (tek cümle)

- **İşletme verisi** (hesap, marka, personel, plan): veri sorumlusu = **Vardiya / Zihnora**.
- **Personel verisi** (çalışanın adı, telefonu, vardiyası): veri sorumlusu =
  **hesabı açan işletme**, veri işleyen = **Vardiya**. İşletmeye verilecek örnek
  metin: `/personel-aydinlatma`.

## Yayındaki teknik karşılıklar

| Yükümlülük | Kodda karşılığı |
| --- | --- |
| Aydınlatma metni | `/gizlilik` (sürüm `2026-10-30`) |
| Aydınlatma onayı ve kanıtı | Kayıt formunda zorunlu onay kutusu → `KvkkOnay` tablosu (`src/lib/kvkk.ts`) |
| Veri taşınabilirliği | `GET /api/hesap/veri` (JSON indirme) |
| Unutulma hakkı | `/api/hesap/sil` + gizlilik sayfasındaki düğme |
| Veri minimizasyonu | Ücret/TC/kart/konum istenmez; IP ham saklanmaz (günlük tuzlu özet) |
| Çerez | Yalnız zorunlu oturum çerezi; analitik/reklam çerezi yok |
| Yurt dışı aktarım | Yalnız isteğe bağlı "Google ile giriş" |

## Güncelleme kuralı

Aydınlatma metni değişirse:

1. `src/lib/kvkk.ts` içindeki `AYDINLATMA_SURUMU` değerini yeni tarihle değiştir.
2. `/gizlilik` sayfasındaki "Sürüm" satırını güncelle.
3. Bu klasördeki envanteri aynı tarihle güncelle.

Eski onay yeni metni kapsamaz; sürüm değişince kullanıcıya gizlilik sayfasında
"metin güncellendi" notu gösterilir.
