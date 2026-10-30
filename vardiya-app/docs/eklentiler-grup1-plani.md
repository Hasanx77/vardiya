# #eklentiler — 1. Grup Uygulama Planı

**Karar (30 Eki 2026):** patron jibble'ın "planlamaya yakın" özelliklerini seçti.
PDKS (giriş-çıkış damgası), GPS takip, selfie/parmak izi doğrulama ve bordro
**kapsam dışı** — ürün "sadece planlama" konumunu korur, KVKK yükü artmaz.

**Mevcut şema:** `User`, `Business`, `Employee`, `ShiftTemplate`, `Assignment`,
`Announcement`, `DayNote`, `WeekPlan` (+ ham SQL ile lazy kurulan `Visit`,
`Message`, `EmployeeLink`, `HizinSiniri`, `KvkkOnay` tabloları).

Yeni tablolar aynı yöntemle **lazy** kurulacak: canlıda migration beklemeden
devreye girer, arıza hâlinde fail-open çalışır (`src/lib/kvkk.ts` deseni).

---

## 1) İzin / mazeret talebi  ← ilk sıra

**Neden ilk:** en çok istenen özellik; planlamayı doğrudan etkiliyor
("Ali cumartesi izin istedi" bilgisi bugün WhatsApp'ta kayboluyor).

| Alan | Değer |
| --- | --- |
| Yeni tablo | `IzinTalebi` (id, employeeId, businessId, baslangic, bitis, tur, not, durum, createdAt, kararAt, kararNot) |
| `tur` | `izin` · `mazeret` · `rapor` · `degisim` |
| `durum` | `bekliyor` · `onaylandi` · `reddedildi` · `iptal` |
| Personel tarafı | `/ekip/[id]` linkinde "İzin talebi" formu (girişsiz, imzalı link) |
| Patron tarafı | Panelde "Onay bekleyen" kartı; onaylayınca plan hücresine **uyarı** düşer ("izinli") |
| KVKK | Sağlık/mazeret detayı **isteğe bağlı ve serbest metin**; "rapor" türünde belge istenmez |
| İş | ~1 gün (tablo + 2 uç + 2 ekran + test) |

## 2) Vardiya değişim talebi

**Neden:** personel kendi vardiyasını takas etmek istiyor; bugün patronun
telefonuna düşüyor.

| Alan | Değer |
| --- | --- |
| Yeni tablo | `DegisimTalebi` (id, businessId, isteyenEmployeeId, hedefEmployeeId, assignmentId, durum, createdAt, kararAt) |
| Akış | personel "bu vardiyayı değiştirmek istiyorum" → hedef personel kabul/red → patron onayı → `Assignment` güncellenir |
| Kural | Yayınlanmış haftada değişiklik yapılırsa hafta **taslağa düşmez**; "yeniden yayınla" uyarısı çıkar (mevcut `WeekPlan` mantığı) |
| İş | ~1,5 gün (tablo + 3 uç + personel ekranı + test) |

## 3) Okundu bilgisi

**Neden:** "mesajı gördün mü?" sorusunu bitirir.

| Alan | Değer |
| --- | --- |
| Yeni tablo | `Okundu` (businessId, employeeId, tur: `plan`\|`duyuru`, hedefId, zaman) |
| Nerede | Personel linkinde plan/duyuru açılınca tek satır yazılır |
| Panelde | "12 personelden 9'u gördü" + görmeyenlerin listesi |
| Gizlilik | Yalnız "gördü/görmedi"; konum, cihaz, IP saklanmaz |
| İş | ~yarım gün |

## 4) Otomatik hatırlatma

**Neden:** planı yayınladıktan sonra "hâlâ bakmayanlara" tek tıkla hatırlatma.

| Alan | Değer |
| --- | --- |
| Nasıl | Panelde "görmeyenlere hatırlat" düğmesi → mevcut SMTP (`src/lib/mail.ts`) ile tek e-posta |
| Sınır | Personelin e-postası yoksa WhatsApp metni kopyalanabilir bağlantı (mevcut davranış) |
| Kötüye kullanım | Hesap başına günlük 1 hatırlatma (`HizinSiniri` deseni) |
| İş | ~yarım gün |

## 5) Çalışılan saat raporu

**Neden:** jibble'ın en çok kullanılan raporu; ama **damga** olmadan, planlanan
saatten üretilir (PDKS'e girmeden).

| Alan | Değer |
| --- | --- |
| Kaynak | `Assignment` + `ShiftTemplate` (planlanan saat) |
| Ekran | `/raporlar` mevcut; "Personel × hafta toplam saat" tablosu + CSV indir |
| Sınır | "Fiili çalışma" değil, **planlanan** saat. Etikette açıkça yazılır. |
| İş | ~yarım gün |

---

## Sıra ve toplam

1. İzin/mazeret talebi (1 gün)
2. Okundu bilgisi (0,5 gün)
3. Otomatik hatırlatma (0,5 gün)
4. Çalışılan (planlanan) saat raporu (0,5 gün)
5. Vardiya değişim talebi (1,5 gün)

**Toplam ~4 gün.** Her adım ayrı yayınlanabilir; hiçbiri diğerini beklemez.

## Kapsam dışı (bilinçli)

| Jibble özelliği | Neden yok |
| --- | --- |
| Giriş-çıkış damgası (PDKS) | Ürün konumu "planlama"; ayrı bir ürün kararı gerekir |
| GPS / konum takibi | Özel nitelikli izleme, KVKK riski yüksek, çalışan güveni zedeler |
| Selfie / yüz / parmak izi | Biyometrik veri — ayrı açık rıza ve yüksek yük |
| Bordro, fazla mesai ödemesi | Muhasebe yazılımının işi; yanlış hesap hukuki risk |
| Proje/etkinlik bazlı zaman | Kafe-restoran planlamasında karşılığı yok |

## Açık sorular (patron)

1. İzin talebi **personel linkinden** mi gelsin, yoksa patronun elle girdiği
   bir kayıt mı yeterli? (Öneri: ikisi de — personel talep eder, patron girer.)
2. "Rapor" türünde belge yükleme isteyelim mi? (Öneri: **hayır** — sağlık verisi
   toplamak yükü büyütür.)
3. Hatırlatma e-postası personelin **kendi** adresine mi gitsin? (Bugün personelde
   e-posta alanı yok; eklenmesi gerekir.)
