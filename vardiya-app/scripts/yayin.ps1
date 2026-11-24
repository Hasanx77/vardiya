# Vardiya — tek komutla yayın
# docs/yayin-talimati.md dosyasındaki kanıtlanmış sırayı birebir uygular.
# Kullanım:  .\scripts\yayin.ps1
param(
    [string]$Sunucu = "zihnorac@venus.hostingdunyam.net",
    [string]$UzakDizin = "/home/zihnorac/vardiya-app"
)

$ErrorActionPreference = "Stop"
$kok = Split-Path -Parent $PSScriptRoot
Set-Location $kok

function Adim($metin) { Write-Host "`n==> $metin" -ForegroundColor Cyan }

# --- 0) Sunucudaki runtime ile aynı Next sürümü şart (Kural 1) -------------
Adim "Next sürümü kontrol ediliyor (sunucu: 16.4.0)"
$surum = (Get-Content "node_modules\next\package.json" -Raw | ConvertFrom-Json).version
if ($surum -ne "16.4.0") {
    Write-Host "    yerelde $surum var, 16.4.0 kuruluyor..." -ForegroundColor Yellow
    npm install next@16.4.0 --save-exact --ignore-scripts --force | Out-Null
}
$surum = (Get-Content "node_modules\next\package.json" -Raw | ConvertFrom-Json).version
if ($surum -ne "16.4.0") { throw "Next 16.4.0 kurulamadı (şu an: $surum). Yayın iptal." }
Write-Host "    tamam: $surum"

# --- 1) Derle ------------------------------------------------------------
Adim "Derleniyor (temiz .next)"
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
npx next build --webpack
if ($LASTEXITCODE -ne 0) {
    Write-Host "    ilk derleme uyarıyla durdu, aynı komut tekrar deneniyor..." -ForegroundColor Yellow
    npx next build --webpack
}
if ($LASTEXITCODE -ne 0) { throw "Derleme başarısız. Yayın iptal." }

# --- 2) Yerel üretim testi ----------------------------------------------
Adim "Yerel üretim testi (port 3100)"
$islem = Start-Process -FilePath "npx" -ArgumentList "next","start","-p","3100" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 8
try {
    $kodlar = @("/", "/gizlilik", "/panel", "/api/state", "/ekip/gecersiz") | ForEach-Object {
        $k = curl.exe -s -o NUL -w "%{http_code}" "http://localhost:3100$_"
        "{0,-16} {1}" -f $_, $k
    }
    $kodlar | ForEach-Object { "    $_" }
} finally {
    Stop-Process -Id $islem.Id -Force -ErrorAction SilentlyContinue
}

# --- 3) Paketle ----------------------------------------------------------
Adim "Paketleniyor"
if (Test-Path "next.tgz") { Remove-Item "next.tgz" -Force }
tar -czf next.tgz --exclude=.next/cache --exclude=.next/dev --exclude=.next/node_modules --exclude="*.map" .next
Write-Host "    next.tgz hazır ($([math]::Round((Get-Item next.tgz).Length / 1MB, 1)) MB)"

# --- 4) Yükle ------------------------------------------------------------
Adim "Sunucuya yükleniyor (SSH parolası istenecek)"
scp next.tgz "${Sunucu}:/home/zihnorac/"
if ($LASTEXITCODE -ne 0) { throw "Yükleme başarısız." }

# --- 5) Sunucuda takas + restart (SSH parolası tekrar istenecek) ---------
Adim "Sunucuda takas yapılıyor ve uygulama başlatılıyor"
$uzakBetik = @'
set -e
cd /home/zihnorac/vardiya-app
for p in /proc/[0-9]*; do cmd=$(tr '\0' ' ' < "$p/cmdline" 2>/dev/null); \
  case "$cmd" in *lsnode*) kill -9 "${p#/proc/}";; esac; done
rm -rf .next-yeni && mkdir .next-yeni
tar xzf ~/next.tgz -C .next-yeni --strip-components=1
cp -a .next/node_modules .next-yeni/node_modules
mv .next ".next.eski-$(date +%Y%m%d%H%M)" && mv .next-yeni .next
touch tmp/restart.txt
'@
ssh $Sunucu $uzakBetik
if ($LASTEXITCODE -ne 0) { throw "Sunucu tarafı başarısız. Geri dönüş: durdur -> mv .next.eski-* .next -> touch tmp/restart.txt" }

# --- 6) Doğrula ----------------------------------------------------------
Adim "Canlıda doğrulanıyor"
Start-Sleep -Seconds 6
$ana = curl.exe -s -o NUL -w "%{http_code}" "https://zihnora.com.tr/"
$api = curl.exe -s -o NUL -w "%{http_code}" "https://zihnora.com.tr/api/state"
Write-Host "    /          -> $ana  (beklenen 200)"
Write-Host "    /api/state -> $api  (beklenen 401)"

$gtm = curl.exe -s "https://zihnora.com.tr/" | Select-String -SimpleMatch "googletagmanager"
if ($gtm) { Write-Host "    etiket sayfada BULUNDU ✔" -ForegroundColor Green }
else { Write-Host "    etiket sayfada bulunamadı ✘" -ForegroundColor Red }
