# Veri İhlali Müdahale Planı

> Amaç: ihlal **şüphesinde** ilk 72 saatte ne yapılacağını tereddütsüz bilmek.
> Bu plan koddaki gerçek akışlara göre yazıldı; yılda bir kez gözden geçir.

**Sürüm:** 2026-10-30 · **Sahip:** Zihnora / Vardiya

---

## 0) "İhlal" ne sayılır?

- Veritabanına veya sunucuya yetkisiz erişim şüphesi
- Hesap ele geçirme (başka biri hesaba girdi / şifre değişti)
- Yedek dosyasının veya `.env` içeriğinin dışarı çıkması
- Personel linkinin (`/ekip/...`) yanlış kişiye gitmesi
- Yanlış alıcıya kişisel veri içeren e-posta/PDF gitmesi
- Silme talebinin yerine getirilmemesi (veri hâlâ duruyor)

## 1) İlk 60 dakika — kapsa, kaydet, durdur

| # | Adım | Nasıl |
| --- | --- | --- |
| 1 | Olayı yaz | Tarih/saat, fark eden kişi, belirti (tek satır) |
| 2 | Yayılımı durdur | Şüpheli hesabı kilitle; gerekirse `AUTH_SECRET` döndür → **tüm oturumlar düşer** |
| 3 | Kanıtı koru | Sunucu günlüklerini ve `prisma/dev.db` kopyasını ayrı klasöre al; üzerine yazma |
| 4 | Etkiyi belirle | Hangi tablo, kaç kayıt, hangi işletme, hangi kişi |
| 5 | Erişimi kıs | Gerekirse paneli bakım moduna al (`.next` yerine geçici yönlendirme) |

**Hesap ele geçirme şüphesinde hızlı yol:** `sessionVersion` +1 yapılır ve
şifre sıfırlama bağlantısı gönderilir — eski oturum çerezleri anında geçersiz olur.

## 2) İlk 72 saat — bildirim

KVKK m.12/5: ihlal, **en kısa sürede ve 72 saat içinde** Kurul'a bildirilir.

- **Kurul:** Kişisel Verileri Koruma Kurumu — ihlal bildirim formu (online).
- **İlgili kişi:** etkilenen kullanıcılara/personele e-posta. İçerik: ne oldu,
  hangi veri, ne zaman, ne yaptık, sen ne yapmalısın (şifre değiştir, 2FA aç).
- **Veri sorumlusu işletmeler:** personel verisi etkilendiyse, hesap sahibine
  ayrıca yazılır — çünkü o verinin sorumlusu işletmedir, Vardiya işleyendir.

Bildirim metni şu üç soruyu yanıtlamalı: **ne oldu · kimi etkiledi · ne yapıyoruz.**

## 3) Bildirim sonrası

| Süre | İş |
| --- | --- |
| 24 saat | Teknik düzeltme (yama, yapılandırma, yetki daraltma) |
| 72 saat | Kurul bildirimi tamamlanmış olmalı; taslak bile olsa kayda geçir |
| 7 gün | Kök neden analizi: nasıl oldu, neden fark edilmedi, hangi test eksikti |
| 30 gün | Kalıcı önlem + test; `docs/kvkk/veri-isleme-envanteri.md` risk tablosunu güncelle |

## 4) Kayıt defteri (her olay için bir satır)

| Tarih | Olay | Etki | Bildirim | Durum |
| --- | --- | --- | --- | --- |
| — | Henüz kayıtlı ihlal yok | — | — | — |

> Bu tablo boş kalmalı; dolarsa üstteki adımlar işletilmiş demektir.

## 5) Hazır komutlar (sunucu)

```bash
# Tüm oturumları düşür (şüpheli erişimde)
# .env içindeki AUTH_SECRET değerini 32+ karakterlik yeni bir değerle değiştir,
# sonra uygulamayı yeniden başlat:
touch tmp/restart.txt

# Yedeği ayrı yere al (üzerine yazmadan)
cp prisma/dev.db /home/zihnorac/yedek/olay-$(date +%F-%H%M).db

# Kimin ne zaman girdiğini gör (User tablosu)
# lastLoginAt + sessionVersion alanları panelden/DB'den okunur.
```

## 6) Sık yapılan hatalar

- İhlali "önce çözerim, sonra bildiririm" diye bekletmek — 72 saat işliyor.
- Kanıtı silmek (log temizliği, tabloyu boşaltmak).
- Yalnız Kurul'a bildirip **kullanıcıya** yazmamak.
- Personel verisinde işletmeyi bilgilendirmemek — sorumluluk işletmede.
