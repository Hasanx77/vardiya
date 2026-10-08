# 📓 Geliştirme Günlüğü — Vardiya

> Sen bilgisayardan ayrıldığında JARVIS otonom geliştirmeye devam etti.
> Bu dosya, döndüğünde neler olduğunu 2 dakikada görmen için.

## 🗓️ 8 Ekim 2026 — Otonom geliştirme oturumu

### Başlangıç durumu
Next.js 16 ile yalın MVP vardı: açılış sayfası + panel (personel ekle, haftalık ızgara, WhatsApp'tan gönder).

### Eklenenler (hepsi test edilip commit'lendi ✅)

| # | Özellik |
|---|---|
| 1 | **Veritabanı** — Prisma 6 + SQLite, API rotaları, panel veritabanına bağlandı |
| 2 | **Personel görünümü** (`/ekip`) + **izin/değişim talepleri** + onay/red |
| 3 | **Vardiya şablonu yönetimi** (ekle/düzenle/sil, renk seçici) |
| 4 | **Geçen haftayı kopyala** / **haftayı temizle** |
| 5 | **Personel düzenleme** (ad / görev / telefon / saatlik ücret) |
| 6 | **Saatlik ücret + tahmini işçilik maliyeti** özeti |
| 7 | **Yazdırılabilir haftalık çizelge** (`/yazdir`) |
| 8 | **Toplu WhatsApp gönderimi** (tek tek uğraşmadan) |
| 9 | **CSV (Excel) dışa aktarım** — puantaj/muhasebe |
| 10 | **Ayarlar**: demo veri yükle / boş başla |
| 11 | **Mevzuat & çakışma analizi** (İş Kanunu 4857: 45 saat, %50 fazla mesai, 11 saat dinlenme) |
| 12 | **Personel arama** + **günlük kapsama** satırı + **boş başlangıç** ekranı |
| 13 | **`/bugun` tahtası** — kafede tablete açılacak, dakikada yenilenen "bugün kim çalışıyor" ekranı |
| 14 | **Vitest + 32 birim testi** (dates, shifts, whatsapp, compliance) |
| 15 | **README** (kurulum + yayına alma) ve **yeni tanıtım sayfası** |
| 16 | **GitHub private repo**: `Hasanx77/vardiya` |

### Nasıl çalıştırılır?
```powershell
cd vardiya-app
npm.cmd install
npx.cmd prisma migrate dev   # ilk kez
npm.cmd run dev              # http://localhost:3000
npm.cmd test                 # birim testleri
```
Sayfalar: `/` · `/panel` · `/ekip` · `/bugun` · `/yazdir`

### ⚠️ Ortam notları
- PowerShell `npm.ps1`'i engelliyor → **`npm.cmd` / `npx.cmd`** kullan.
- OneDrive `node_modules`'ı bazen bozuyor (Next.js native SWC dosyası yarım inmişti;
  silip `npm.cmd install` ile düzeldi). Uzun vadede projeyi `C:\dev` gibi OneDrive
  dışına taşımak iyi olur.
- Şema değişince dev server'ı **yeniden başlat** (Prisma istemcisi tazelensin).

### 🎯 Sıradaki adımlar (öneri)
1. **Pilot kafe** ile gerçek test — geri bildirim topla (en önemli adım!).
2. **Postgres'e geç + Vercel'e yayın** (adımlar README'de) → telefondan test.
3. **Giriş/kullanıcı hesapları** + çoklu işletme (satışa hazır).
4. WhatsApp/SMS otomatik hatırlatma.
