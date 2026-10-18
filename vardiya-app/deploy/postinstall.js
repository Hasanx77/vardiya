/**
 * Sunucu kurulum betiği (cPanel / CloudLinux Node.js Selector).
 *
 * Neden böyle: Bu hosting pakette SSH yok. Ama Node.js Selector'da
 * "Run NPM Install" düğmesi var ve npm, bağımlılıkları kurduktan sonra
 * "postinstall" betiğini çalıştırır. Tüm kurulum adımları burada:
 *   prisma generate → prisma migrate deploy → next build
 *
 * ÖNEMLİ (CloudLinux farkı): paketler uygulama klasörüne değil, sanal ortama
 * kurulur → /home/<kullanici>/nodevenv/<uygulama>/<sürüm>/lib/node_modules
 * Bu yüzden araçlar (prisma, next) oradan çözülür; NODE_PATH de oraya verilir.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const KOK = path.resolve(__dirname, "..");
const LINUX = process.platform === "linux";

// Modül klasörü: sanal ortam varsa orası, yoksa uygulama klasörü
const MODUL = process.env.VIRTUAL_ENV
  ? path.join(process.env.VIRTUAL_ENV, "lib", "node_modules")
  : path.join(KOK, "node_modules");

const LOG_DOSYALARI = [path.join(KOK, "deploy.log"), "/home/zihnorac/public_html/deploy.log"];

function yaz(metin) {
  const satir = `[${new Date().toISOString()}] ${metin}\n`;
  process.stdout.write(satir);
  for (const yol of LOG_DOSYALARI) {
    try {
      fs.appendFileSync(yol, satir);
    } catch (e) {
      /* yazılamayan log dosyası sorun değil */
    }
  }
}

function calistir(komut, zorunlu) {
  yaz("$ " + komut);
  try {
    const cikti = execSync(komut, {
      cwd: KOK,
      encoding: "utf8",
      stdio: "pipe",
      maxBuffer: 32 * 1024 * 1024,
      env: { ...process.env, NODE_ENV: "production", NODE_PATH: MODUL },
    });
    if (cikti) yaz(cikti.trim().slice(-3000));
    yaz("OK: " + komut);
    return true;
  } catch (e) {
    yaz("HATA: " + komut);
    if (e.stdout) yaz("stdout: " + String(e.stdout).slice(-3000));
    if (e.stderr) yaz("stderr: " + String(e.stderr).slice(-3000));
    yaz("mesaj: " + String(e.message || e));
    if (zorunlu) {
      yaz("=== ZORUNLU ADIM BASARISIZ ===");
      process.exit(1);
    }
    return false;
  }
}

yaz(`=== postinstall basladi (platform=${process.platform}, kok=${KOK}, modul=${MODUL}) ===`);
yaz(`VIRTUAL_ENV=${process.env.VIRTUAL_ENV || "(yok)"}  PATH(ilk 120)=${(process.env.PATH || "").slice(0, 120)}`);

if (process.env.SKIP_DEPLOY === "1") {
  yaz("SKIP_DEPLOY=1 -> kurulum atlandi");
  process.exit(0);
}

if (!fs.existsSync(MODUL)) {
  yaz(`!! modul klasoru bulunamadi: ${MODUL}`);
  process.exit(1);
}

yaz("modul klasoru ilk 10: " + fs.readdirSync(MODUL).slice(0, 10).join(", "));

const prismaCli = path.join(MODUL, "prisma", "build", "index.js");
const nextCli = path.join(MODUL, "next", "dist", "bin", "next");

yaz(`prismaCli var mi: ${fs.existsSync(prismaCli)} | nextCli var mi: ${fs.existsSync(nextCli)}`);

// 1) Prisma istemcisi (her ortamda gerekli)
calistir(`"${process.execPath}" "${prismaCli}" generate`, true);

if (LINUX) {
  // 2) Veritabanı şemasını uygula (SQLite dosyası yoksa oluşturur)
  calistir(`"${process.execPath}" "${prismaCli}" migrate deploy`, false);
  // 3) Üretim derlemesi
  calistir(`"${process.execPath}" "${nextCli}" build`, true);
  yaz("=== kurulum tamamlandi ===");
} else {
  yaz("Windows/gelistirme ortami: derleme atlandi (sadece prisma generate).");
}
