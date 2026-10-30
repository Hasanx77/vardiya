# Saklama ve İmha Politikası

**Sürüm:** 2026-10-30 · **Sahip:** Zihnora / Vardiya

Kural tek cümle: **her veri, işi bittiği gün değil, işi için gereken son günde
silinir.** Süre dolunca silme otomatiktir; elle iş beklemez.

---

## 1) Saklama süreleri

| Veri | Süre | Dayanak |
| --- | --- | --- |
| Hesap, işletme, personel, plan, duyuru, not | Hesap silinene kadar | Sözleşmenin ifası |
| Aydınlatma onay kaydı (`KvkkOnay`) | 12 ay | İspat yükü (KVKK m.10) |
| Ziyaret sayacı (`Visit`, tuzlu özet) | 120 gün | Sayaç amacı |
| İletişim mesajı (`Message`) | En çok 12 ay | Talebin yanıtlanması |
| Şifre sıfırlama anahtarı (`PasswordReset`) | 60 dakika (kullanılınca hemen) | Güvenlik |
| Giriş denemesi sayacı (`GirisDenemesi`) | 24 saat sonra temizlenir | Güvenlik |
| Sunucu yedeği | 14 gün, dönüşümlü | Felaket kurtarma |
| Hata günlüğü | En çok 30 gün | Arıza giderme |

## 2) Silme yöntemi

| Durum | Yöntem |
| --- | --- |
| Kullanıcı "hesabımı sil" der | `DELETE /api/hesap/sil` → işletme + personel + vardiya + duyuru + not + oturumlar **tek işlemde** silinir (`onDelete: Cascade`) |
| Süre doldu | Uygulama içi temizlik (`src/lib/visits.ts`, `src/lib/kvkk.ts`) günde bir kez çalışır |
| Yedek süresi doldu | Yeni yedek eskisini iter; 14 günden eski dosya kalmaz |
| Sunucu kapanıyor / taşınıyor | Disk imajı alınmaz; veritabanı kopyası teslim edilmez, imha tutanağı yazılır |

**Anonimleştirme yok, silme var.** Kişisel veri "kullanılmaz" hâle getirilerek
değil, kayıttan çıkarılarak imha edilir. Silinen kayıt geri getirilemez.

## 3) Yedekler ve silme ilişkisi

Hesap silindiğinde canlı veritabanından hemen düşer. Yedekler **döner** olduğu
için silinen kayıt en geç **14 gün** içinde yedeklerden de düşer. Bir hesap
sahibi "yedekten de hemen silinsin" derse: yedek arşivi açılır, ilgili satırlar
çıkarılır, arşiv yeniden yazılır (talebi destek adresinden iletmesi yeterli).

## 4) İmha tutanağı şablonu

```
Tarih:
İmha edilen veri: (tablo / dosya)
Kişi/işletme: (hesap e-postası — TC yazılmaz)
Yöntem: (kayıttan silme / dosya silme / arşiv yeniden yazma)
Yapan: (ad)
Not:
```

## 5) Yıllık kontrol listesi

- [ ] Saklama süreleri hâlâ gerçeklerle uyuşuyor mu?
- [ ] Otomatik temizlik çalışıyor mu (sayaç, onay, mesaj)?
- [ ] Yedekler 14 günle sınırlı mı, sunucu dışında kopya var mı?
- [ ] Silme talebi test edildi mi (hesap sil → veri gerçekten gitti mi)?
- [ ] Aydınlatma metni sürümü ile `AYDINLATMA_SURUMU` aynı mı?
