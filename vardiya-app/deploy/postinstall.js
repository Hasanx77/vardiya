/**
 * Sunucu kurulum betiği (cPanel / CloudLinux Node.js Selector).
 *
 * Neden böyle: Bu hosting pakette SSH yok. Ama Node.js Selector'da
 * "Run NPM Install" düğmesi var ve npm, bağımlılıkları kurduktan sonra
 * "postinstall" betiğini çalıştırır. Biz de tüm kurulum adımlarını
 * (Prisma istemcisi, veritabanı şeması, üretim derlemesi) buraya koyduk —
 * böylece sunucuda tek düğmeye basmak yetiyor.
 *
 * Her adım ../deploy.log dosyasına da yazılır; uzaktan okumak için.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const KOK = path.resolve(__dirname, "..");
const LOG = path.join(KOK, "deploy.log");

function yaz(metin) {
  const satir = `[${new Date().toISOString()}] ${metin}\n`;
  process.stdout.write(satir);
  try {
    fs.appendFileSync(LOG, satir);
  } catch (e) {
    /* log yazılamazsa sorun değil */
  }
}

function arac(ad) {
  return path.join(KOK, "node_modules", ".bin", process.platform === "win32" ? `${ad}.cmd` : ad);
}

function calistir(komut, zorunlu) {
  yaz("$ " + komut);
  try {
    const cikti = execSync(komut, {
      cwd: KOK,
      encoding: "utf8",
      stdio: "pipe",
      maxBuffer: 32 * 1024 * 1024,
      env: { ...process.env, NODE_ENV: "production" },
    });
    if (cikti) yaz(cikti.trim().slice(-3000));
    yaz("OK: " + komut);
    return true;
  } catch (e) {
    yaz("HATA: " + komut);
    if (e.stdout) yaz("stdout: " + String(e.stdout).slice(-3000));
    if (e.stderr) yaz("stderr: " + String(e.stderr).slice(-3000));
    yaz(String(e.message || e));
    if (zorunlu) {
      yaz("=== ZORUNLU ADIM BASARISIZ, kurulum durdu ===");
      process.exit(1);
    }
    return false;
  }
}

yaz(`=== postinstall basladi (platform=${process.platform}, cwd=${KOK}) ===`);

if (process.env.SKIP_DEPLOY === "1") {
  yaz("SKIP_DEPLOY=1 -> kurulum atlandi");
  process.exit(0);
}

// 1) Prisma istemcisi: her ortamda gerekli (yerel geliştirme dahil)
if (!calistir(`"${arac("prisma")}" generate`, true)) process.exit(1);

if (process.platform === "linux") {
  // 2) Veritabanı şemasını uygula (SQLite dosyası yoksa oluşturur)
  calistir(`"${arac("prisma")}" migrate deploy`, false);
  // 3) Üretim derlemesi
  calistir(`"${arac("next")}" build`, true);
  yaz("=== kurulum tamamlandi ===");
} else {
  yaz("Windows/gelistirme ortami: derleme atlandi (sadece prisma generate).");
}
