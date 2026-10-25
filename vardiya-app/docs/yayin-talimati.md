# Vardiya — yayın (deploy) talimatı

> Bu dosya, **yaşanmış iki kesintiden** sonra yazıldı. Sıraya uyulmazsa site 500 verir.

## Sunucu gerçekleri

| Ne | Değer |
|---|---|
| Host | `zihnorac@venus.hostingdunyam.net` (SSH var, parola ile) |
| Uygulama kökü | `/home/zihnorac/vardiya-app` |
| Node | v22.23.4 |
| **Next (runtime)** | **16.4.0** |
| Prisma | 6.19.3 · SQLite (`prisma/dev.db`) |
| Süreç | LiteSpeed `lsnode` (UNIX soket) — `app.js` sunucuyu kurar |

## 🔴 Kural 1 — Derleme sunucudaki Next ile AYNI olmalı

Yerelde `next` **16.4.3** kuruluysa üretilen `.next`, sunucudaki 16.4.0 runtime'ında
`TypeError: ensureInstrumentation is not a function` verir. Bu yüzden:

```powershell
npx next --version          # "Next.js v16.4.0" OLMALI
# değilse:
npm install next@16.4.0 --save-exact --ignore-scripts --force
npx next --version          # tekrar doğrula
```

> `package.json` 16.4.3 diyor olabilir (npm audit düzeltmesi). **Derleme için değil,
> sunucu yükseltmesi yapıldığında** 16.4.3'e geçilecek.

## 🔴 Kural 2 — Sunucuda `npm install` ÇALIŞTIRMA

Sunucuda `node_modules` bir **symlink** (`nodevenv/vardiya-app/22/lib/node_modules`).
`npm install` symlink'i siler, yarıda kalırsa uygulama açılmaz. (Yaşandı.)
Gerekirse: `ln -sfn /home/zihnorac/nodevenv/vardiya-app/22/lib/node_modules node_modules`

## Yayın adımları (kanıtlanmış sıra)

1. **Derle**
   ```powershell
   Remove-Item -Recurse -Force .next
   npx next build --webpack     # ilk deneme uyarıyla durursa AYNI komutu tekrar çalıştır
   ```
2. **Yerelde üretim testi** (atlanmaz!)
   ```powershell
   npx next start -p 3100
   # / 200 · /gizlilik 200 · /panel 307 · /api/state 401 · /ekip/gecersiz 404
   ```
3. **Paketle**
   ```powershell
   tar -czf next.tgz --exclude=.next/cache --exclude=.next/dev `
       --exclude=.next/node_modules --exclude="*.map" .next
   ```
4. **Yükle** — `scp next.tgz zihnorac@venus.hostingdunyam.net:/home/zihnorac/`
5. **Sunucuda: önce DURDUR, sonra takas et, sonra başlat**
   ```sh
   cd /home/zihnorac/vardiya-app
   # 1) durdur
   for p in /proc/[0-9]*; do cmd=$(tr '\0' ' ' < "$p/cmdline" 2>/dev/null); \
     case "$cmd" in *lsnode*) kill -9 "${p#/proc/}";; esac; done
   # 2) çıkar + prisma istemcisini koru
   rm -rf .next-yeni && mkdir .next-yeni
   tar xzf ~/next.tgz -C .next-yeni --strip-components=1
   cp -a .next/node_modules .next-yeni/node_modules
   # 3) takas (süreç yokken)
   mv .next .next.eski-$(date +%Y%m%d%H%M) && mv .next-yeni .next
   # 4) başlat
   touch tmp/restart.txt
   ```
6. **Doğrula** (3 istek)
   ```sh
   curl -s -o /dev/null -w "%{http_code}\n" https://zihnora.com.tr/           # 200
   curl -s -o /dev/null -w "%{http_code}\n" https://zihnora.com.tr/api/state  # 401
   curl -s https://zihnora.com.tr/ | grep -o "$(cat .next/BUILD_ID)" | head -1
   ```
7. Başarısızsa geri al: durdur → `rm -rf .next && mv .next.eski-* .next` → `touch tmp/restart.txt`

## Prisma şeması değiştiyse

```sh
# 1) yeni şemayı yükle:  scp prisma/schema.prisma zihnorac@…:vardiya-app/prisma/
# 2) uygulamayı durdur (yukarıdaki gibi), sonra:
CHECKPOINT_DISABLE=1 npx prisma migrate deploy
CHECKPOINT_DISABLE=1 npx prisma generate      # şart: yoksa prisma.<yeniModel> undefined → 500
```
> Migration çalışırken `spawn EAGAIN` alırsan sebep **süreç limiti**: önce `lsnode` durdur.

## Yedek / geri dönüş

- DB: `cp prisma/dev.db prisma/dev.db.bak-$(date +%Y%m%d)`
- Sürüm: sunucuda `.next.eski-*` klasörleri durur.
- `scripts/vacuum.mjs` **elle** çalıştırılır (uygulama durdurulmuşken).
