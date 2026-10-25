/**
 * TOTP (RFC 6238) — iki adımlı doğrulama kodları.
 *
 * Neden kendi yazıldı: sunucuya yeni paket eklemek `.next` taşıma akışını
 * (node_modules hariç) kırma riski taşıyor. TOTP zaten ~40 satırlık, standart
 * ve test edilebilir bir algoritma; bağımlılık eklemeye değmez.
 *
 * - Sır: 20 rastgele bayt → Base32 (authenticator uygulamalarının beklediği biçim)
 * - Kod: 6 hane, 30 saniyelik adım, HMAC-SHA1 (uygulamalarla uyumlu)
 * - Doğrulama: saat kaymasına karşı ±1 adım tolerans
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const ADIM_SANIYE = 30;
export const HANE = 6;

/** Rastgele Base32 sır üretir (20 bayt = 32 karakter). */
export function sirUret(): string {
  return base32Kodla(randomBytes(20));
}

export function base32Kodla(veri: Buffer): string {
  let bitler = 0;
  let deger = 0;
  let cikti = "";
  for (const bayt of veri) {
    deger = (deger << 8) | bayt;
    bitler += 8;
    while (bitler >= 5) {
      cikti += BASE32[(deger >>> (bitler - 5)) & 31];
      bitler -= 5;
    }
  }
  if (bitler > 0) cikti += BASE32[(deger << (5 - bitler)) & 31];
  return cikti;
}

export function base32Coz(metin: string): Buffer {
  const temiz = metin.toUpperCase().replace(/[\s-]/g, "").replace(/=+$/, "");
  let bitler = 0;
  let deger = 0;
  const baytlar: number[] = [];
  for (const harf of temiz) {
    const i = BASE32.indexOf(harf);
    if (i < 0) continue;
    deger = (deger << 5) | i;
    bitler += 5;
    if (bitler >= 8) {
      baytlar.push((deger >>> (bitler - 8)) & 0xff);
      bitler -= 8;
    }
  }
  return Buffer.from(baytlar);
}

/** Zaman damgasının hangi 30 saniyelik adımda olduğu. */
export function adimNo(zamanMs = Date.now()): number {
  return Math.floor(zamanMs / 1000 / ADIM_SANIYE);
}

/** Belirli bir adım için 6 haneli kod. */
export function kodUret(sir: string, adim: number, hane = HANE): string {
  const anahtar = base32Coz(sir);
  const sayac = Buffer.alloc(8);
  const yuksek = Math.floor(adim / 2 ** 32);
  const dusuk = adim % 2 ** 32;
  sayac.writeUInt32BE(yuksek, 0);
  sayac.writeUInt32BE(dusuk, 4);

  const ozet = createHmac("sha1", anahtar).update(sayac).digest();
  const konum = ozet[ozet.length - 1] & 0x0f;
  const ikili =
    ((ozet[konum] & 0x7f) << 24) |
    (ozet[konum + 1] << 16) |
    (ozet[konum + 2] << 8) |
    ozet[konum + 3];
  return String(ikili % 10 ** hane).padStart(hane, "0");
}

/** Kod biçimi geçerli mi? (boşlukları temizler) */
export function kodNormalle(girdi: string): string {
  return (girdi ?? "").replace(/\D/g, "");
}

/**
 * Kodu doğrular. `sonAdim` verilirse **aynı kodun tekrar kullanılması** da
 * engellenir (replay): yalnızca son kullanılan adımdan yeni adımlar kabul edilir.
 *
 * Dönüş: eşleşen adım numarası ya da null.
 */
export function kodDogrula(
  sir: string,
  kod: string,
  secenekler: { zamanMs?: number; tolerans?: number; sonAdim?: number } = {},
): number | null {
  const temiz = kodNormalle(kod);
  if (temiz.length !== HANE) return null;

  const simdi = adimNo(secenekler.zamanMs ?? Date.now());
  const tolerans = secenekler.tolerans ?? 1;
  const son = secenekler.sonAdim ?? -1;

  for (let fark = -tolerans; fark <= tolerans; fark++) {
    const adim = simdi + fark;
    if (adim <= son) continue;
    const beklenen = Buffer.from(kodUret(sir, adim));
    const gelen = Buffer.from(temiz);
    if (beklenen.length === gelen.length && timingSafeEqual(beklenen, gelen)) {
      return adim;
    }
  }
  return null;
}

/** Authenticator uygulamasına okutulacak `otpauth://` adresi. */
export function otpauthAdresi(eposta: string, sir: string, satici = "Vardiya"): string {
  const etiket = encodeURIComponent(`${satici}:${eposta}`);
  const parametreler = new URLSearchParams({
    secret: sir,
    issuer: satici,
    algorithm: "SHA1",
    digits: String(HANE),
    period: String(ADIM_SANIYE),
  });
  return `otpauth://totp/${etiket}?${parametreler.toString()}`;
}
