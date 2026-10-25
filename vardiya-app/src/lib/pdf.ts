/**
 * PDF üretimi — sunucuda, tarayıcı/Chromium olmadan.
 *
 * Neden pdf-lib: paylaşımlı hostingde headless Chromium yok (ve 1 GB RAM'i
 * kaldırmaz). pdf-lib saf JavaScript; A4 yatay bir plan sayfası üretmek için
 * fazlasıyla yeterli.
 *
 * 🔤 Türkçe karakter: PDF'in yerleşik Helvetica'sı ş/ğ/ı/İ bilmez. Bu yüzden
 * `public/fonts/NotoSans-Regular.ttf` gömülür (tek dosya, ~570 KB, bir kez
 * yüklenir; her PDF'te alt küme olarak yer alır).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export type PdfSatir = {
  ad: string;
  rol: string;
  /** 7 hücre; boşsa o gün çalışmıyor. */
  gunler: string[];
  toplamSaat: number;
};

export type PdfGirdi = {
  isletme: string;
  hafta: string;
  gunBasliklari: string[];
  satirlar: PdfSatir[];
  ozet: string[];
  uyarilar: string[];
  olusturma: string;
};

const A4_YATAY = { genislik: 841.89, yukseklik: 595.28 };
const KENAR = 34;

const RENK = {
  metin: rgb(0.09, 0.09, 0.1),
  soluk: rgb(0.45, 0.45, 0.48),
  cizgi: rgb(0.86, 0.86, 0.87),
  baslikZemin: rgb(0.08, 0.09, 0.1),
  baslikYazi: rgb(0.98, 0.98, 0.98),
  amber: rgb(0.71, 0.33, 0.04),
  cizgili: rgb(0.975, 0.975, 0.97),
  uyari: rgb(0.62, 0.16, 0.12),
};

/** Fontu bir kez oku (her PDF'te diski yormayalım). */
let fontOnbellek: Buffer | null = null;
async function fontVerisi(): Promise<Buffer> {
  if (fontOnbellek) return fontOnbellek;
  const yol = path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf");
  fontOnbellek = await readFile(yol);
  return fontOnbellek;
}

/** Metni kutuya sığdır: gerekirse "…" ile kısalt. */
function kisalt(metin: string, font: PDFFont, boyut: number, azami: number): string {
  const temiz = (metin ?? "").replace(/\s+/g, " ").trim();
  if (font.widthOfTextAtSize(temiz, boyut) <= azami) return temiz;
  let kesik = temiz;
  while (kesik.length > 1 && font.widthOfTextAtSize(`${kesik}…`, boyut) > azami) {
    kesik = kesik.slice(0, -1);
  }
  return `${kesik}…`;
}

/** Uzun metni en fazla `satirSayisi` satıra böl. */
function satirlaraBol(
  metin: string,
  font: PDFFont,
  boyut: number,
  azami: number,
  satirSayisi = 2,
): string[] {
  const temiz = (metin ?? "").replace(/\s+/g, " ").trim();
  if (!temiz) return [];
  const kelimeler = temiz.split(" ");
  const satirlar: string[] = [];
  let simdiki = "";

  for (const kelime of kelimeler) {
    const aday = simdiki ? `${simdiki} ${kelime}` : kelime;
    if (font.widthOfTextAtSize(aday, boyut) <= azami) {
      simdiki = aday;
      continue;
    }
    if (simdiki) satirlar.push(simdiki);
    simdiki = kelime;
    if (satirlar.length === satirSayisi - 1) break;
  }
  if (simdiki && satirlar.length < satirSayisi) satirlar.push(simdiki);

  return satirlar.map((s) => kisalt(s, font, boyut, azami));
}

function ustbilgi(
  page: PDFPage,
  font: PDFFont,
  girdi: PdfGirdi,
  sayfaNo: number,
  sayfaSayisi: number,
) {
  const { width: genislik, height: yukseklik } = page.getSize();
  const sag = genislik - KENAR;

  page.drawText(kisalt(girdi.isletme, font, 16, genislik * 0.55), {
    x: KENAR,
    y: yukseklik - KENAR - 12,
    size: 16,
    font,
    color: RENK.metin,
  });
  page.drawText("Haftalık vardiya planı", {
    x: KENAR,
    y: yukseklik - KENAR - 28,
    size: 9,
    font,
    color: RENK.soluk,
  });

  const haftaGenislik = font.widthOfTextAtSize(girdi.hafta, 11);
  page.drawText(girdi.hafta, {
    x: sag - haftaGenislik,
    y: yukseklik - KENAR - 12,
    size: 11,
    font,
    color: RENK.metin,
  });
  const sayfaMetni = `Sayfa ${sayfaNo}/${sayfaSayisi}`;
  page.drawText(sayfaMetni, {
    x: sag - font.widthOfTextAtSize(sayfaMetni, 8),
    y: yukseklik - KENAR - 26,
    size: 8,
    font,
    color: RENK.soluk,
  });

  page.drawLine({
    start: { x: KENAR, y: yukseklik - KENAR - 40 },
    end: { x: sag, y: yukseklik - KENAR - 40 },
    thickness: 1,
    color: RENK.cizgi,
  });
}

export async function planPdf(girdi: PdfGirdi): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const font = await pdf.embedFont(await fontVerisi(), { subset: true });

  const { genislik, yukseklik } = A4_YATAY;
  const icGenislik = genislik - KENAR * 2;
  const adKolonu = 132;
  const gunKolonu = (icGenislik - adKolonu) / 7;
  const baslikYuksekligi = 24;
  const satirYuksekligi = 40;

  // Sayfa başına kaç satır sığar? (alt bilgi alanı 70 pt)
  const ilkY = yukseklik - KENAR - 40 - baslikYuksekligi;
  const altSinir = KENAR + 66;
  const satirKapasitesi = Math.max(1, Math.floor((ilkY - altSinir) / satirYuksekligi));

  const sayfaSayisi = Math.max(
    1,
    Math.ceil(Math.max(1, girdi.satirlar.length) / satirKapasitesi),
  );

  const sayfalar: PDFPage[] = [];
  for (let i = 0; i < sayfaSayisi; i++) sayfalar.push(pdf.addPage([genislik, yukseklik]));

  sayfalar.forEach((page, indeks) => {
    ustbilgi(page, font, girdi, indeks + 1, sayfaSayisi);

    let y = ilkY;

    // --- Başlık satırı (koyu şerit) ---
    page.drawRectangle({
      x: KENAR,
      y: y - baslikYuksekligi + 6,
      width: icGenislik,
      height: baslikYuksekligi,
      color: RENK.baslikZemin,
    });
    page.drawText("Personel", {
      x: KENAR + 8,
      y: y - 10,
      size: 8.5,
      font,
      color: RENK.baslikYazi,
    });
    girdi.gunBasliklari.forEach((gun, i) => {
      const x = KENAR + adKolonu + i * gunKolonu;
      page.drawText(kisalt(gun, font, 8.5, gunKolonu - 8), {
        x: x + 6,
        y: y - 10,
        size: 8.5,
        font,
        color: RENK.baslikYazi,
      });
    });

    y -= baslikYuksekligi;

    // --- Satırlar ---
    const dilim = girdi.satirlar.slice(
      indeks * satirKapasitesi,
      (indeks + 1) * satirKapasitesi,
    );

    dilim.forEach((satir, sira) => {
      const ust = y;
      const alt = y - satirYuksekligi;

      if (sira % 2 === 1) {
        page.drawRectangle({
          x: KENAR,
          y: alt,
          width: icGenislik,
          height: satirYuksekligi,
          color: RENK.cizgili,
        });
      }

      // Ad + rol
      page.drawText(kisalt(satir.ad, font, 9.5, adKolonu - 16), {
        x: KENAR + 8,
        y: ust - 14,
        size: 9.5,
        font,
        color: RENK.metin,
      });
      const rolSatirlari = satirlaraBol(satir.rol, font, 7.5, adKolonu - 16, 1);
      if (rolSatirlari[0]) {
        page.drawText(rolSatirlari[0], {
          x: KENAR + 8,
          y: ust - 25,
          size: 7.5,
          font,
          color: RENK.soluk,
        });
      }

      // Gün hücreleri
      satir.gunler.forEach((hucre, i) => {
        const x = KENAR + adKolonu + i * gunKolonu;
        const dikey = { start: { x, y: ust }, end: { x, y: alt } };
        page.drawLine({ ...dikey, thickness: 0.5, color: RENK.cizgi });

        if (!hucre) return;
        const parcalar = satirlaraBol(hucre, font, 7.6, gunKolonu - 10, 2);
        parcalar.forEach((parca, j) => {
          page.drawText(parca, {
            x: x + 5,
            y: ust - 13 - j * 9,
            size: 7.6,
            font,
            color: RENK.metin,
          });
        });
      });

      page.drawLine({
        start: { x: KENAR, y: alt },
        end: { x: KENAR + icGenislik, y: alt },
        thickness: 0.5,
        color: RENK.cizgi,
      });

      y = alt;
    });

    // --- Alt bilgi (özet + uyarılar) ---
    const altY = KENAR + 40;
    page.drawLine({
      start: { x: KENAR, y: altY + 18 },
      end: { x: KENAR + icGenislik, y: altY + 18 },
      thickness: 1,
      color: RENK.cizgi,
    });

    if (indeks === sayfaSayisi - 1) {
      let x = KENAR;
      for (const parca of girdi.ozet) {
        const metin = `• ${parca}`;
        page.drawText(metin, { x, y: altY + 5, size: 8, font, color: RENK.soluk });
        x += font.widthOfTextAtSize(metin, 8) + 14;
      }

      if (girdi.uyarilar.length) {
        page.drawText(
          kisalt(
            `Uyarılar: ${girdi.uyarilar.slice(0, 4).join(" · ")}`,
            font,
            7.5,
            icGenislik,
          ),
          { x: KENAR, y: altY - 8, size: 7.5, font, color: RENK.uyari },
        );
      }
    }

    page.drawText(`${girdi.olusturma} · Vardiya`, {
      x: KENAR,
      y: KENAR + 12,
      size: 7.5,
      font,
      color: RENK.soluk,
    });
    page.drawText("zihnora.com.tr", {
      x: KENAR + icGenislik - font.widthOfTextAtSize("zihnora.com.tr", 7.5),
      y: KENAR + 12,
      size: 7.5,
      font,
      color: RENK.amber,
    });
  });

  return pdf.save();
}
