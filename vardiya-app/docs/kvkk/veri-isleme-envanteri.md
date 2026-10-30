# Veri İşleme Envanteri (VERBİS taslağı)

**Veri sorumlusu:** Zihnora / Vardiya — zihnora.com.tr
**İletişim:** destek@zihnora.com.tr
**Son güncelleme:** 30 Ekim 2026 · **Envanter sürümü:** 2026-10-30

> VERBİS kayıt yükümlülüğü yıllık çalışan sayısı ve mali bilanço eşiğine
> bağlıdır. Eşik altında kalınsa bile bu envanter tutulur; eşik aşılırsa
> doğrudan VERBİS'e aktarılır.

---

## 1) Kayıt ve hesap yönetimi

| Alan | Değer |
| --- | --- |
| Veri kategorisi | Kimlik (e-posta), işlem güvenliği (şifre özeti, oturum, giriş zamanı) |
| Veri konusu kişi | İşletme sahibi / hesap sahibi |
| Amaç | Hesap oluşturma, giriş, şifre sıfırlama, hesap güvenliği |
| Hukuki sebep | Sözleşmenin kurulması/ifası (m.5/2-c), meşru menfaat (m.5/2-f) |
| Toplama yöntemi | Kayıt formu, Google ile giriş (isteğe bağlı), çerez |
| Saklama | Hesap silinene kadar |
| Aktarım | Yok (Google ile giriş kullanılırsa Google — ABD) |
| Teknik önlem | scrypt özet, HMAC imzalı httpOnly çerez, 2FA (TOTP), kalıcı giriş kilidi |

## 2) İşletme bilgileri

| Alan | Değer |
| --- | --- |
| Veri kategorisi | İşletme adı, mesai saatleri, vardiya şablonları |
| Amaç | Planlama ekranını kişiselleştirmek |
| Hukuki sebep | Sözleşmenin ifası |
| Saklama | Hesap silinene kadar |

## 3) Personel kayıtları (işletme adına işlenir)

| Alan | Değer |
| --- | --- |
| Veri kategorisi | Kimlik (ad), iletişim (telefon), mesleki deneyim (görev), izin hakkı |
| Veri konusu kişi | İşletmenin çalışanları |
| Veri sorumlusu | **İşletme** — Vardiya **veri işleyen** |
| Amaç | Haftalık vardiya planı, personele ulaşma, izin takibi |
| Hukuki sebep | İşletme tarafından belirlenir (genelde m.5/2-c, m.5/2-f) |
| Saklama | Hesap silinene kadar (işletme siler) |
| Özel nitelikli veri | **İşlenmez** (sağlık, din, sendika, biyometri yok) |
| Ücret verisi | **İstenmez, saklanmaz** |

## 4) Vardiya planı ve duyurular

| Alan | Değer |
| --- | --- |
| Veri kategorisi | Çalışma düzeni (tarih, saat, vardiya türü), duyuru metni, gün notu |
| Amaç | Planı oluşturmak, yayınlamak, PDF/`.ics` üretmek |
| Saklama | Hesap silinene kadar; yayınlanmamış taslaklar personel linkinde görünmez |

## 5) İletişim mesajları

| Alan | Değer |
| --- | --- |
| Veri kategorisi | Kimlik (ad), iletişim (e-posta), mesaj içeriği |
| Amaç | Talebi yanıtlamak |
| Hukuki sebep | Meşru menfaat / açık rıza (formdaki onay kutusu) |
| Saklama | En çok 12 ay |
| Not | Pazarlama listesine eklenmez, üçüncü tarafa verilmez |

## 6) Ziyaret sayacı

| Alan | Değer |
| --- | --- |
| Veri kategorisi | Günlük tuzlu IP özeti (geri tanımlanamaz), tarih |
| Amaç | Kaç kişinin siteyi gördüğünü bilmek (analitik değil, sayaç) |
| Çerez | **Kullanılmaz** |
| Saklama | 120 gün |
| Aktarım | Yok — üçüncü taraf analitik yok |

## 7) Aydınlatma onay kaydı

| Alan | Değer |
| --- | --- |
| Veri kategorisi | Kullanıcı kimliği, metin sürümü, onay zamanı, günlük tuzlu IP özeti |
| Amaç | Aydınlatmanın yapıldığını **ispatlamak** (KVKK m.10) |
| Saklama | 12 ay, sonra otomatik silinir |
| Teknik | `KvkkOnay` tablosu, `src/lib/kvkk.ts` |

## 8) Teknik günlükler

| Alan | Değer |
| --- | --- |
| Veri kategorisi | Hata kayıtları (kullanıcı kimliği, hata tipi) |
| Amaç | Arıza giderme ve güvenlik |
| Saklama | En çok 30 gün |
| Not | İstek gövdesi, şifre veya mesaj içeriği günlüğe yazılmaz |

---

## İşlenmeyen veriler (bilinçli sınır)

T.C. kimlik numarası · ücret/maaş · kredi kartı · IBAN · konum · sağlık verisi ·
biyometri · cihaz parmak izi · reklam kimliği · üçüncü taraf analitik ·
reklam pikseli · sosyal medya profili.

## Risk değerlendirmesi (kısa)

| Risk | Olasılık | Etki | Önlem |
| --- | --- | --- | --- |
| Hesap ele geçirme | Orta | Yüksek | scrypt + 2FA + kalıcı giriş kilidi + oturum sürümü |
| Yetkisiz veri erişimi (kod hatası) | Düşük | Yüksek | Her sorgu `businessId` ile filtreli, testlerle doğrulanır |
| Sunucu/disk arızası | Düşük | Orta | Günlük yedek, 14 gün dönüşümlü, sunucu dışında kopya |
| Yanlış alıcıya e-posta | Düşük | Orta | E-posta yalnız hesap sahibine; personel linki imzalı ve süreli |
| Kötüye kullanım (bot) | Orta | Düşük | Gizli bal küpü + IP/e-posta başına kalıcı deneme sınırı |
