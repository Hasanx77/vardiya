# E-posta kodları — tasarım ve güvenlik notları

> 24 Kasım 2026 · Vardiya (zihnora.com.tr)
>
> Amaç: hesap eylemlerini **e-postaya gelen 6 haneli kod** ile doğrulamak.
> Bağlantı (link) yerine kod seçildi: telefonda uygulamaya dönüp kodu yazmak
> daha hızlı ve e-posta güvenlik tarayıcıları bağlantıyı önden açıp
> "kullanılmış" hâle getiremiyor.

## Akışlar

| Amaç (`amac`) | Nerede | Ne yapar |
|---|---|---|
| `dogrulama` | `/eposta-dogrula` | Oturumdaki adresi doğrular (`emailVerifiedAt`) |
| `giris` | `/kodla-giris` | Şifresiz giriş (kod = tek faktör) |
| `sifre` | `/sifre-sifirla` | Kodu doğrular + yeni şifreyi kaydeder, tüm oturumları düşürür |
| `eposta-degistir` | `/profil` | Yeni adresi onaylar, hesabın e-postasını taşır |

Eski **bağlantı** akışı (`/sifre-sifirla/yeni`) yalnızca geçmişte gönderilmiş
e-postalar için duruyor; yeni istekler kod ile çalışır.

## Kurallar

| Kural | Değer | Neden |
|---|---|---|
| Kod uzunluğu | 6 hane (`randomInt`) | Yazması kolay, 1M olasılık + deneme limiti |
| Geçerlilik | **10 dakika** | Uzun ömür riski azaltır |
| Tek kullanım | Evet (`tuketildi`) | Tekrar oynatma (replay) engeli |
| Yanlış deneme | **5** sonra kod ölür | Kaba kuvvet |
| Yeniden gönderme | **60 saniye** | Bombardıman |
| Saatlik gönderim | **5 / e-posta** | Bombardıman |
| IP sınırı | 20 / 10 dk (kalıcı sayaç) | Dağıtık deneme |
| Saklama | Kod **özeti** (HMAC-SHA256), 2 gün | Düz kod asla saklanmaz |
| Bağlama | `amac + e-posta + kod` | Bir akışın kodu diğerinde çalışmaz |
| Karşılaştırma | `timingSafeEqual` | Zamanlama sızıntısı yok |
| Hesap varlığı | Sızdırılmaz | Kayıtlı olmayan adrese de aynı yanıt |

## Yeni tablo (migration gerekmez)

`EpostaKodu` tablosu **ilk kullanımda ham SQL** ile kurulur
(`CREATE TABLE IF NOT EXISTS`), böylece canlıya `prisma migrate` beklemeden
çıkar. Saklanan alanlar:

```
id, email, amac, kodHash, sonKullanma (ISO), deneme, tuketildi,
createdAt (ISO), userId, ipHash
```

`sonKullanma` ve `createdAt` **ISO metin**: Prisma'nın SQLite sürücüsü büyük
tamsayı zaman damgalarını INT32 sanıp taşma hatası veriyordu.

## E-posta şablonu

`lib/posta-sablonlari.ts → kodPostasi()`: koyu başlık + büyük kod
(`123 456`), 10 dakika notu, "bu isteği sen yapmadıysan yok say" ve
"kodu kimseyle paylaşma" uyarısı. Metin sürümü de gönderilir (spam puanı).

## Neden bu kadar sınır?

- 6 hane = 1.000.000 olasılık; 5 denemede başarı şansı **%0,0005**.
- 10 dakika + 60 sn bekleme → saatte en fazla 5 kod, hepsi 5 denemeli.
- Kilit, kodu öldürdüğü için saldırgan sıfırdan kod isteyip yeniden başlamak
  zorunda (saatlik 5 sınırı).
- Kod özeti HMAC ile `AUTH_SECRET`'a bağlı; veritabanı sızsa bile kodlar
  doğrudan okunamaz.

## Kalan işler (bilinçli)

- E-posta gönderiminde **SPF/DKIM/DMARC** ayarları (mevcut: SPF + DKIM var,
  DMARC `p=none` ve `rua` yok — hata raporu gelmiyor).
- Gmail'e giden postada teslim edilebilirlik ölçümü (bounce oranı).
- Kod denemelerinin güvenlik günlüğünde ayrı sekme olarak izlenmesi.
