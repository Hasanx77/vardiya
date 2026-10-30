# Alt İşleyen (Veri İşleyen) Listesi

**Sürüm:** 2026-10-30 · **Veri sorumlusu:** Zihnora / Vardiya

Vardiya, kişisel verileri yalnızca aşağıdaki hizmetler üzerinden işler. Her
satır için amaç, konum ve sözleşme durumu kayıtlıdır. Liste değişirse bu dosya
ve `/gizlilik` sayfası birlikte güncellenir.

| # | Alt işleyen | Hizmet | İşlenen veri | Konum | Sözleşme |
| --- | --- | --- | --- | --- | --- |
| 1 | Hosting Dünyam (venus.hostingdunyam.net) | Paylaşımlı barındırma, disk, yedek | Tüm uygulama verisi | Türkiye | Hizmet sözleşmesi + gizlilik taahhüdü |
| 2 | zihnora.com.tr posta sunucusu (kendi SMTP) | İşlemsel e-posta | E-posta adresi, ad, plan PDF | Türkiye | Kendi altyapımız (alt işleyen değil, aynı sorumlu) |
| 3 | Google (Identity Services) — **isteğe bağlı** | "Google ile giriş" | E-posta, Google kimliği (sub) | ABD | Google API Hizmet Şartları |

## Notlar

- **Veri satışı yok.** Hiçbir alt işleyen veriyi kendi amacıyla kullanamaz.
- **Analitik yok.** Google Analytics, Meta Pixel, Hotjar vb. kurulu değil;
  bu yüzden ayrı bir çerez onay bandı gerekmiyor (yalnız zorunlu oturum çerezi var).
- **Google ile giriş isteğe bağlı.** Kullanılmazsa yurt dışına aktarım olmaz.
  Kullanılırsa yalnız kimlik doğrulama verisi gider; kişiler/takvim/dosya erişimi istenmez.
- **Yurt dışına aktarım** yalnız 3. satırda ve yalnız kullanıcı tercihiyle olur;
  aydınlatma metninde açıkça yazılıdır.
- **Destek e-postası** Google altyapısında çalışıyorsa, oraya giden yazışmalar
  için aynı sınır geçerlidir: pazarlama yok, üçüncü tarafla paylaşım yok.

## Sözleşme kontrolü (yılda bir)

- [ ] Barındırma sağlayıcısının gizlilik/veri koruma taahhüdü güncel mi?
- [ ] Sunucu Türkiye'de mi (IP ve sağlayıcı doğrulandı mı)?
- [ ] Yeni bir üçüncü taraf servis eklendi mi? Eklendiyse buraya yazıldı mı?
- [ ] `/gizlilik` sayfasındaki tablo bu dosyayla aynı mı?
