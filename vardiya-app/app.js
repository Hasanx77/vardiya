/**
 * cPanel / CloudLinux Node.js Selector (LiteSpeed "lsnode") başlangıç dosyası.
 *
 * ⚠️ ÖNEMLİ DERS: LiteSpeed uygulamayı bir TCP portunda DEĞİL, bir **UNIX
 * soketinde** bekler ve yolu `LSNODE_SOCKET` ortam değişkeniyle verir.
 * `next start` yalnızca TCP dinleyebildiği için uygulama cevap vermiyordu
 * (istekler zaman aşımına düşüyordu). Bu yüzden Next'in programatik API'siyle
 * kendi HTTP sunucumuzu kurup soketi dinliyoruz.
 */
process.env.NODE_ENV = "production";

const fs = require("fs");
const http = require("http");
const next = require("next");

const LOG = __dirname + "/baslatma.log";
const yaz = (m) => {
  try {
    fs.appendFileSync(LOG, "[" + new Date().toISOString() + "] " + m + "\n");
  } catch (e) {
    /* log yazılamazsa sorun değil */
  }
};

const soket = process.env.LSNODE_SOCKET;
const port = Number(process.env.PORT) || 3000;
yaz("BASLADI soket=" + soket + " port=" + port);

const uygulama = next({ dev: false, dir: __dirname, hostname: "localhost", port });
const isleyici = uygulama.getRequestHandler();

uygulama
  .prepare()
  .then(() => {
    const sunucu = http.createServer((req, res) => isleyici(req, res));
    sunucu.on("error", (e) => yaz("SUNUCU HATASI " + e));
    if (soket) {
      sunucu.listen(soket, () => yaz("Unix soket dinleniyor: " + soket));
    } else {
      sunucu.listen(port, () => yaz("TCP dinleniyor: " + port));
    }
  })
  .catch((e) => {
    yaz("PREPARE HATASI " + e);
    process.exit(1);
  });
