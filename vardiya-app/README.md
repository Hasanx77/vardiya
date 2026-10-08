# Vardiya 🗓️

Kafe & restoranlar için **vardiya yönetimi** uygulaması.
Excel ve WhatsApp yerine: 5 dakikada haftalık plan kur, personele tek tıkla WhatsApp'tan gönder.

> Bu bir MVP'dir. Gerçek pilot müşteriyle test edilip geri bildirime göre geliştirilir.

---

## ✨ Özellikler

- 👥 **Personel yönetimi** — ekle, düzenle (ad/görev/telefon/saatlik ücret), sil
- 🗓️ **Haftalık vardiya ızgarası** — personel × gün, süratle doldur
- 🎨 **Vardiya şablonları** — Sabah/Akşam/Tam Gün + kendi şablonlarını ekle/düzenle (renkli)
- ⚖️ **45 saat uyarısı** — İş Kanunu haftalık süreyi aşan personel kırmızı işaretlenir
- 💰 **Tahmini işçilik maliyeti** — saatlik ücret × saat
- 📲 **WhatsApp gönderimi** — tek tık veya "Tümüne Gönder"
- 🧑‍🍳 **Personel görünümü** — çalışan kendi programını görür, **izin/değişim talebi** gönderir
- ⏳ **Talep yönetimi** — patron talebi onaylar/reddeder; onaylanan izin vardiyayı kaldırır
- 🖨 **Yazdırılabilir çizelge** — duvara asılacak haftalık çizelge
- ⧉ **Geçen haftayı kopyala** / 🗑 haftayı temizle
- 🗄️ **Veritabanı** (Prisma + SQLite) — veriler sunucuda, kalıcı

---

## 🚀 Kurulum

```powershell
cd vardiya-app

# Bağımlılıklar (PowerShell'de npm yerine npm.cmd kullanın)
npm.cmd install

# Veritabanını oluştur + Prisma istemcisini üret
npx.cmd prisma migrate dev
```

## ▶️ Çalıştırma

```powershell
npm.cmd run dev
```

Aç: <http://localhost:3000>

- `/` → tanıtım + fiyatlandırma
- `/basla` → **90 saniyede kurulum** (işletme adı + toplu personel yapıştır)
- `/panel` → yönetim paneli
- `/bugun` → "bugün kim çalışıyor" tahtası (tablet için)
- `/raporlar` → aylık saat/maliyet/izin raporları
- `/ekip` → personel görünümü
- `/yazdir` → yazdırılabilir çizelge

---

## 🧱 Teknoloji

| Katman | Teknoloji |
|---|---|
| Çatı | Next.js 16 (App Router) + React 19 |
| Dil | TypeScript |
| Stil | Tailwind CSS 4 |
| Veritabanı | Prisma 6 + SQLite |
| Doğrulama/tipler | TypeScript (strict) |

---

## 📁 Yapı

```
src/
  app/
    page.tsx              # tanıtım
    panel/page.tsx        # yönetim paneli
    ekip/                 # personel görünümü
    yazdir/page.tsx       # yazdırılabilir çizelge
    api/                  # sunucu uçları (state, employees, assignments, templates, requests, reset)
  components/
    TemplateManager.tsx   # vardiya şablonu yönetimi
  lib/
    prisma.ts             # veritabanı bağlantısı
    server-data.ts        # işletme kurulumu + demo veri
    api-client.ts         # istemci tarafı API fonksiyonları
    dates.ts shifts.ts colors.ts whatsapp.ts types.ts validate.ts
prisma/
  schema.prisma           # veri modeli
  dev.db                  # SQLite veritabanı (git'e girmez)
```

---

## ⚠️ Ortam notları (bu makineye özel)

- PowerShell `npm.ps1` betiğini engelliyor → **`npm.cmd` / `npx.cmd`** kullan.
- Proje **OneDrive** içinde. `node_modules` bazen OneDrive senkronunda bozulabiliyor
  (ör. Next.js native SWC dosyası yarım inmişti). Böyle bir hata görürsen:
  `Remove-Item node_modules\@next\swc-win32-x64-msvc -Recurse -Force` + `npm.cmd install`
  → şema değişince dev server'ı **yeniden başlat** (Prisma istemcisi tazelensin diye).
- Uzun vadede projeyi OneDrive dışına (ör. `C:\dev`) taşımak hız ve sağlık açısından iyi olur.

---

## ☁️ Yayına alma (Vercel + Postgres)

SQLite yalnızca **yerel geliştirme** içindir; sunucusuz (serverless) ortamda kalıcı olmaz.
Yayına alırken Postgres'e geçilir:

1. Ücretsiz bir Postgres oluştur (Neon, Supabase veya Vercel Postgres).
2. `prisma/schema.prisma` içinde sağlayıcıyı değiştir:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. Ortam değişkenine bağlantı adresini yaz (`.env` ya da Vercel → Environment Variables):

   ```
   DATABASE_URL="postgresql://kullanici:sifre@host:5432/vardiya?schema=public"
   ```

4. Tabloları oluştur: `npx.cmd prisma migrate deploy`
5. Vercel'e deploy et ve `DATABASE_URL`'i ekle. (Build komutu: `npx prisma generate && next build`)

## 🗺️ Yol haritası

- [ ] Çoklu işletme / kullanıcı hesapları (giriş)
- [ ] Postgres'e geçiş + yayına alma (Vercel)
- [ ] Otomatik WhatsApp/SMS hatırlatma
- [ ] Birden fazla şube
- [ ] Puantaj / bordro dışa aktarım (Excel/PDF)
- [ ] PDKS entegrasyonu

---

*Vardiya — kafe & restoranlar için vardiya yönetimi.*
