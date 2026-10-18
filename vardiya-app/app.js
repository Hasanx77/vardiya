/**
 * cPanel (CloudLinux Node.js Selector / Passenger) başlangıç dosyası.
 *
 * Node.js Selector'daki "Application startup file" alanı bu dosyayı gösterir.
 * Passenger bu dosyayı çalıştırır; biz de Next.js'in üretim sunucusunu
 * (next start) Passenger'ın verdiği PORT üzerinde başlatıyoruz.
 *
 * Neden ayrı dosya: Node.js Selector bir *modül* ister, "next start" ise bir
 * komut satırı aracıdır. Bu küçük sarmalayıcı ikisini birleştirir.
 */
process.env.NODE_ENV = "production";

const path = require("path");
const { spawn } = require("child_process");

const port = process.env.PORT || 3000;
const nextBin = path.join(__dirname, "node_modules", "next", "dist", "bin", "next");

console.log(`[app.js] Next.js baslatiliyor: port=${port}`);

const cocuk = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
  cwd: __dirname,
  stdio: "inherit",
  env: process.env,
});

cocuk.on("exit", (kod, sinyal) => {
  console.log(`[app.js] Next.js kapandi (kod=${kod}, sinyal=${sinyal})`);
  process.exit(kod === null ? 1 : kod);
});

["SIGTERM", "SIGINT"].forEach((sinyal) => {
  process.on(sinyal, () => {
    console.log(`[app.js] ${sinyal} alindi, kapatiliyor...`);
    cocuk.kill(sinyal);
  });
});
