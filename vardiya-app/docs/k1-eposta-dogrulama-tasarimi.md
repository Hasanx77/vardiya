# K-1 — E-posta doğrulama akışı tasarımı

> Durum: **taslak / onay bekliyor.** Bu belgede kod yok; uygulama sırası ve karar
> noktaları var. Onaylanmadan hiçbir migration çalıştırılmamalı.

## 1) Sorun

Kayıt akışı e-posta adresinin sahibini **doğrulamıyor** (`register/route.ts`).
Buna karşılık iki akış e-posta eşleşmesine göre veriye dokunuyordu:

- `GET /api/hesap/veri` → o adresle gönderilmiş iletişim mesajlarını indiriyordu (**kaldırıldı**, Güvenlik 1).
- `POST /api/hesap/sil` → o adresin mesajlarını siliyordu (**kaldırıldı**, Güvenlik 1).

Kalan risk: bir kişi başkasının e-postasıyla hesap açabilir. Kurban sonradan
"Google ile devam et" derse `google-hesap.ts` e-posta eşleşmesiyle hesabı
**otomatik birleştiriyor** ve kurban, saldırganın şifresini bildiği hesaba giriyor.

## 2) Hedef

1. Hesabın e-posta sahibine ait olduğu **kanıtlanmış** olsun.
2. Mevcut kullanıcılar (canlıda 8 hesap) **bir günde kilitlenmesin**.
3. SMTP çalışmadığında kayıt akışı **ölüme düşmesin** (fallback).
4. Google birleştirme **sessizce** yapılmasın.

Kapsam dışı: pazarlama e-postası, e-posta değiştirme akışı (ayrı iş).

## 3) Veri modeli

`User.emailVerifiedAt` **zaten var** (`schema.prisma`), sadece kayıtta
doldurulmuyor. Ek olarak:

```prisma
model EmailVerification {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String   @unique      // SHA-256; ham jeton yalnız e-postada
  expiresAt DateTime               // 24 saat
  usedAt    DateTime?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

Migration: **tek yeni tablo + index** (mevcut tablolara dokunmaz).
`prisma migrate deploy` uygulama durdurulurken çalıştırılmalı (bilinen SQLite kilidi).

## 4) Mevcut kullanıcılar için geçiş planı

| Grup | Ölçüt | Davranış |
|---|---|---|
| A | `googleId != null` | **Doğrulanmış sayılır** (`emailVerifiedAt = now()`); Google e-postayı zaten doğruladı |
| B | `emailVerifiedAt = null` ve aktif kullanım | **Çalışmaya devam eder**; panelde "e-postanı doğrula" bandı, 30 gün sonra hatırlatma |
| C | Hiç giriş yapmamış (`lastLoginAt = null`) | İlk girişte doğrulama istenir |

**Kademeli sıkılaştırma (önerilen):**
1. Gün 0: doğrulama akışı devrede; kimse engellenmez.
2. Gün 30: doğrulanmamış hesaplarda **veri indirme / hesap silme / 2FA** kapalı.
3. Gün 90: doğrulanmamış hesaplarda **yeni kayıt oluşturma** kapalı (okuma serbest).

> Alternatif (daha sert): gün 0'da herkesi kilitle. **Önerilmez** — destek yükü
> ve "siteye giremiyorum" riski yüksek.

## 5) Kayıt akışı (yeni)

1. `POST /api/auth/register` → kullanıcı + işletme + şablonlar (mevcut).
2. Aynı istekte doğrulama jetonu üret (`randomBytes(32)`, SHA-256 sakla, 24 saat).
3. `dogrulamaPostasi` şablonu ile gönder (`posta-sablonlari.ts:126` hazır).
4. Kullanıcı **giriş yapmış** olur (mevcut davranış) ama `emailVerifiedAt = null`.
5. `GET /api/auth/dogrula?token=...` → tek kullanımlık, süreli, `usedAt` işaretlenir.
6. Panelde durum bandı: "E-postanı doğrula" + "yeniden gönder" (10 dk'da 1).

## 6) SMTP çalışmazsa (fallback)

| Durum | Davranış |
|---|---|
| `postaHazirMi() === false` (yapılandırma yok) | Kayıt **yine açılır**; bantta "doğrulama e-postası gönderilemiyor, destekle iletişime geç" |
| SMTP var ama gönderim hata verdi | Jeton **geçerli kalır**; "yeniden gönder" denenebilir (jeton yenilenir) |
| Tekrarlayan hata | `console.error` + (varsa) sahip bildirimi; **diske yazma yok** (Güvenlik 4) |

**Manuel doğrulama kanalı:** destek adresi üzerinden site sahibi, kullanıcıdan
gelen e-postayı yanıtlayarak doğrular; bunun için küçük bir yönetim ucu
(`/mesajlar` gibi sahip-only) gerekir. Alternatif: kullanıcı **Google ile giriş**
yaparsa otomatik doğrulanır (Google e-postayı doğrular).

## 7) Google birleştirme davranışı (yeni kural)

```
googleId ile kullanıcı bulundu        → giriş (değişiklik yok)
e-posta ile kullanıcı bulundu:
   ├─ emailVerifiedAt != null         → googleId'yi bağla (güvenli)
   ├─ emailVerifiedAt == null
   │     → BAĞLAMA. Kullanıcıya:
   │       "Bu e-posta ile bir hesap var ama doğrulanmamış.
   │        Önce e-postandaki bağlantıyla doğrula, sonra Google ile giriş yap."
   └─ kullanıcı yok                   → yeni hesap (Google e-postası doğrulanmış)
```

Bu, "önce ben kayıt olayım, sonra kurbanın Google girişini kendi hesabıma
bağlayayım" saldırısını kapatır.

## 8) API değişiklikleri

| Uç | Değişiklik |
|---|---|
| `POST /api/auth/register` | Doğrulama jetonu üret + posta gönder (yanıt aynı) |
| `GET /api/auth/dogrula?token=` | **Yeni**: jetonu tüket, `emailVerifiedAt` yaz, `/panel?dogrulandi=1`'e yönlendir |
| `POST /api/auth/dogrula/yenile` | **Yeni**: oturum + 10 dk limit, yeni jeton |
| `POST /api/hesap/veri`, `POST /api/hesap/sil` | `emailVerifiedAt` yoksa **403** (30. günden sonra) |
| `POST /api/hesap/iki-adim` | Doğrulanmamışsa **403** (30. günden sonra) |

## 9) Test planı

1. Kayıt → `emailVerifiedAt = null`, jeton üretildi, posta kuyruğa girdi.
2. Geçerli jeton → `emailVerifiedAt` dolu, jeton `usedAt` işaretli.
3. Aynı jeton ikinci kez → **reddedilir**.
4. Süresi geçmiş jeton (24 saat + 1 dk) → reddedilir.
5. Kurcalanmış jeton → reddedilir.
6. SMTP yok → kayıt yine başarılı, kullanıcıya açıklama gösterilir.
7. Google birleştirme: doğrulanmamış yerel hesap varsa **bağlanmaz**.
8. Google ile açılmış hesap → `emailVerifiedAt` dolu.
9. 30 gün kuralı: `emailVerifiedAt = null` + eski hesap → veri indirme 403.
10. Mevcut kullanıcı (grup B) → giriş ve plan kullanımı bozulmaz.

## 10) Uygulama sırası (öneri)

1. Migration + `EmailVerification` tablosu (uygulama durdurulurken).
2. Jeton üretme/tüketme kütüphanesi + birim testleri.
3. `dogrula` ucu + sayfası + panel bandı.
4. Google birleştirme kuralı (tek dosya: `google-hesap.ts`) + test.
5. 30/90 gün kilitleri (feature flag ile açılabilir: `EPOSTA_DOGRULAMA_SIKI=1`).
6. Mevcut kullanıcılar için toplu `emailVerifiedAt` doldurma (yalnız grup A).

## 11) Karar bekleyen sorular

1. Doğrulama **zorunlu** mu olacak, yoksa yalnız hassas işlemlerde mi (öneri: ikincisi)?
2. Mevcut 8 kullanıcı için 30/90 gün yerine ne kadar süre uygun?
3. Manuel doğrulama yönetim ekranı istiyor musunuz (yoksa destek e-postası yeterli mi)?
4. E-posta değiştirme akışı bu turda gerekli mi?
