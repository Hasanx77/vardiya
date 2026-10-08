# 🗓️ Vardiya Yönetimi SaaS — Girişim Planı

> **Tarih:** 8 Ekim 2026
> **Durum:** Fikir doğrulama aşaması
> **Sektör:** HORECA (restoran, kafe, bar) — vardiyalı saatlik çalışan yönetimi

---

## 1. Konumlandırma (tek cümle)

> **"Excel ve WhatsApp'la vardiya yapmayı bırak. 5 dakikada planla, personele WhatsApp'tan otomatik gönder. Türkçe, mevzuata uygun, cep telefonunda."**

Rakip "kurumsal vardiya yazılımı" satıyor; biz **"patronun akşam 5 dakikada hallettiği iş"** satıyoruz.

---

## 2. Hedef Müşteri (Beachhead — tek dikey!)

**İlk hedef:** Bağımsız **kafe ve restoranlar** (5–30 çalışan, saatlik/vardiyalı personel, tek ya da 2-3 şube).

Neden HORECA?
- Personel devri yüksek → vardiya sürekli karışır (acı taze).
- Saatlik çalışan çok → puantaj/mesai derdi.
- Hâlâ **Excel + WhatsApp grubu** kullanıyorlar (acı kanıtlı).
- Karar verici tek kişi (patron) → satış kısa.

---

## 3. Değer Önerisi (3 net fayda)

| Fayda | Açıklama |
|---|---|
| ⚡ **5 dakikada plan** | Hazır şablonlar (Sabah / Akşam / Tam Gün), sürükle-bırak |
| 📲 **WhatsApp bildirimi** | Personel **uygulama indirmeden** vardiyasını görür — en büyük farkımız |
| ⚖️ **Mevzuat uyarısı** | Haftalık 45 saat, 11 saat dinlenme, fazla mesai → "ceza yemeyin" |

Bonus: Personel izin / vardiya değişimi talebini mobilden yapar, patron tek tıkla onaylar.

---

## 4. İş Modeli & Fiyatlandırma (hipotez — sahada test edilecek)

- **Freemium kanca:** 5 çalışana kadar ücretsiz → güven + viral yayılma.
- **Ücretli:** lokasyon paketi **₺750–1.500/ay** ya da **çalışan başı ₺30–60/ay**.
- **Yıllık ödeme:** %20 indirim (nakit akışı).
- **Ek gelir:** Bordro/puantaj dışa aktarımı (Excel/PDF), PDKS entegrasyonu, kurulum hizmeti.

> Referans: Global oyuncu Shifter çalışan başı $2.5/ay + ilk 5 ücretsiz modeli kullanıyor.

---

## 5. Rekabet & Farklılaşma

| Rakip tipi | Örnek | Zayıflığı | Bizim avantajımız |
|---|---|---|---|
| PDKS devleri | Patron PDKS, Kolayik | Donanım ağırlıklı, pahalı, karmaşık | Hafif, mobil, HORECA'ya özel |
| Global araçlar | Shifton, 7shifts | Kötü yerelleştirme, döviz fiyatı | Türkçe + TL + yerel mevzuat |
| Yerli genel | Mobofis, Shifter, Mirket | Genel amaçlı, kurulum zor | Tek dikeye özel, WhatsApp-native, **kurulumu biz yapıyoruz** |

---

## 6. İlk Müşteri Planı

1. **Çevrende** 8–25 personelli bir kafe/restoran bul (tanıdık = kapı açık).
2. **Ücretsiz 1 ay pilot** teklif et + kurulumu sen yap ("done-for-you").
3. Karşılığında: gerçek geri bildirim + referans + vaka çalışması izni.
4. **5 kişiyle konuş, 1'ini al.** 10 fikir değil, 1 müşterinin parası/sözü değerli.

**Görüşmede sorulacak 3 soru:**
- Vardiyayı şu an nasıl hazırlıyorsun? (Excel mi, WhatsApp mı, defter mi?)
- Bir vardiya planı kaç dakika sürüyor, en son ne zaman karıştı?
- Personel vardiyasını nasıl öğreniyor, kaç kez "gelmeyen" oldu?

---

## 7. İlk 7 Gün Planı (kod YAZMADAN başla!)

| Gün | Yapılacak |
|---|---|
| 1 | 5 potansiyel müşteri listesi + 3 görüşme randevusu ayarla |
| 2 | 2 görüşme yap → acıyı dinle, not al (çözüm önerme, SADECE dinle) |
| 3 | 1 görüşme daha + en acılı 1 işletmeyi pilot için seç |
| 4 | Pilot işletmenin sürecini çıkar (personel sayısı, vardiya tipleri, kurallar) |
| 5 | **Concierge MVP:** kod yok! Google Sheets + WhatsApp ile o işletmenin vardiyasını SEN yönet |
| 6 | Değeri ölç: "planlama 45 dk → 5 dk oldu mu? Personel sorunu azaldı mı?" |
| 7 | Fiyat sına: "bunu otomatik yapan araç ₺X olsa alır mıydın?" → cevaba göre devam/revize |

> 🧠 Kazanç: Bu hafta **para değil, kanıt** topluyoruz. Kanıt varsa kod yazmak kolay; kanıt yoksa kod israftır.

---

## 8. MVP (v1) — Yapılacaklar Listesi

**OLACAK (v1):**
- Personel listesi (ekle/çıkar)
- Haftalık vardiya ızgarası (şablonlu, sürükle-bırak)
- WhatsApp/e-posta ile vardiya bildirimi
- İzin / vardiya değişim talebi + onay
- Basit haftalık saat toplamı + 45 saat uyarısı

**OLMAYACAK (v1):**
- Bordro, kasa, POS, stok, muhasebe entegrasyonu
- PDKS donanımı
- Yapay zeka otomatik planlama (v2)

> Teknoloji adayı: **ASP.NET Core / Blazor** (C# öğrenme yolunla uyumlu) veya hız için **Next.js**. Karar sonraki adımda.

---

## 9. Riskler & Önlemler

| Risk | Önlem |
|---|---|
| KOBİ yazılıma para vermez | Ücretsiz katman + kurulumu sen yap + çok ucuz başla |
| PDKS devleri rakip | Hafiflik ve HORECA uzmanlığı ile ayrış |
| Churn (ilk ay bırakma) | Aylık değer raporları + kişisel ilgi |
| Kapsam kayması (feature creep) | v1 listesine sadık kal |

---

## 10. Başarı Metrikleri (pilot)

- Haftalık planlama süresi: önce vs sonra
- Planlama sırasında hata/çakışma sayısı
- Personel "gelmeyen" (no-show) oranı
- Patron memnuniyeti (1-10)
- **Ödeme niyeti:** "para verir miydin? ne kadar?"
