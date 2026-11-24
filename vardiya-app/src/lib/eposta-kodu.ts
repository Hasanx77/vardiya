/**
 * E-posta ile gönderilen tek kullanımlık **6 haneli kod** — saf kurallar.
 *
 * Neden kod (bağlantı yerine):
 *   • Telefonda bağlantıya tıklamak zorunda kalmadan, uygulamaya dönüp kodu
 *     yazmak yeterli. (Pazarlama trafiğinde dönüşüm daha yüksek.)
 *   • Bağlantı, e-posta güvenlik tarayıcıları tarafından önden açılıp
 *     "kullanılmış" hâle gelebiliyor; kod bundan etkilenmez.
 *
 * Güvenlik kuralları:
 *   • Kod **düz metin saklanmaz**: `AUTH_SECRET` ile HMAC-SHA256 özeti tutulur.
 *   • 10 dakika geçerli, tek kullanımlık, en fazla 5 yanlış deneme.
 *   • Aynı e-posta için 60 saniyede bir yeni kod; saatte en fazla 5 kod.
 *   • Karşılaştırma sabit zamanlı (`timingSafeEqual`).
 *   • Kod, e-posta + amaç ile bağlanır: bir akışın kodu başka akışta çalışmaz.
 *
 * Bu dosyada veritabanı yok — birim testleri ağ/DB olmadan çalışır.
 */
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/** Kodun geçerlilik süresi (dakika). */
export const KOD_OMRU_DK = 10;
/** Aynı kod için azami yanlış deneme. */
export const AZAMI_DENEME = 5;
/** İki kod gönderimi arasındaki en kısa süre (saniye). */
export const TEKRAR_GONDERME_SN = 60;
/** Bir e-posta için saatte azami kod isteği. */
export const SAATLIK_AZAMI_GONDERIM = 5;

export type KodAmaci = "dogrulama" | "giris" | "sifre" | "eposta-degistir" | "hesap-sil";

export const KOD_AMACLARI: readonly KodAmaci[] = [
  "dogrulama",
  "giris",
  "sifre",
  "eposta-degistir",
  "hesap-sil",
] as const;

export function kodAmaciGecerliMi(deger: string): deger is KodAmaci {
  return (KOD_AMACLARI as readonly string[]).includes(deger);
}

/** Amacın insan dili karşılığı (e-posta konusu ve ekran başlığı). */
export function amacBasligi(amac: KodAmaci): string {
  switch (amac) {
    case "dogrulama":
      return "E-posta doğrulama";
    case "giris":
      return "Şifresiz giriş";
    case "sifre":
      return "Şifre sıfırlama";
    case "eposta-degistir":
      return "Yeni e-posta onayı";
    case "hesap-sil":
      return "Hesap silme onayı";
  }
}

/** 6 haneli kod — kriptografik rastgele. */
export function kodUret(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** "123 456" / "123-456" gibi yazımları kabul eder. */
export function koduTemizle(girdi: string): string {
  return String(girdi ?? "").replace(/\D/g, "").slice(0, 6);
}

export function kodBicimiGecerliMi(kod: string): boolean {
  return /^\d{6}$/.test(kod);
}

/** Kodun sunucudaki özeti (e-posta + amaç ile bağlı). */
export function kodOzetle(kod: string, email: string, amac: KodAmaci): string {
  const sir = (process.env.AUTH_SECRET ?? "").trim() || "vardiya-gelistirme-sirri";
  return createHmac("sha256", sir)
    .update(`${amac}:${email.trim().toLowerCase()}:${kod}`)
    .digest("hex");
}

/** Sabit zamanlı özet karşılaştırması. */
export function ozetEsitMi(a: string, b: string): boolean {
  const x = Buffer.from(String(a ?? ""), "utf8");
  const y = Buffer.from(String(b ?? ""), "utf8");
  if (x.length !== y.length || x.length === 0) return false;
  return timingSafeEqual(x, y);
}

export type KodDurumu = "gecerli" | "tuketildi" | "suresi-doldu" | "deneme-limiti";

export type KodKaydi = {
  sonKullanma: string;
  deneme: number;
  tuketildi: boolean | number;
};

/** Kaydın durumu — saf karar. */
export function kodDurumu(kayit: KodKaydi, simdi = new Date()): KodDurumu {
  if (Boolean(kayit.tuketildi)) return "tuketildi";
  const bitis = new Date(kayit.sonKullanma).getTime();
  if (!Number.isFinite(bitis) || bitis <= simdi.getTime()) return "suresi-doldu";
  if (kayit.deneme >= AZAMI_DENEME) return "deneme-limiti";
  return "gecerli";
}

/** Kullanıcıya gösterilecek hata metni. */
export function kodHataMetni(durum: KodDurumu): string {
  switch (durum) {
    case "tuketildi":
      return "Bu kod daha önce kullanıldı. Yeni kod isteyebilirsin.";
    case "suresi-doldu":
      return "Kodun süresi doldu. Yeni kod isteyebilirsin.";
    case "deneme-limiti":
      return "Çok fazla yanlış deneme. Yeni kod isteyebilirsin.";
    case "gecerli":
      return "";
  }
}

/** Kodun kalan geçerlilik süresi (saniye, en az 0). */
export function kalanSaniye(sonKullanma: string, simdi = new Date()): number {
  const bitis = new Date(sonKullanma).getTime();
  if (!Number.isFinite(bitis)) return 0;
  return Math.max(0, Math.floor((bitis - simdi.getTime()) / 1000));
}

/** "3 dk 20 sn" gibi okunabilir kalan süre. */
export function kalanSureMetni(saniye: number): string {
  if (saniye <= 0) return "0 sn";
  const dk = Math.floor(saniye / 60);
  const sn = saniye % 60;
  return dk > 0 ? `${dk} dk ${sn} sn` : `${sn} sn`;
}

/** E-posta biçimi (kayıt/giriş ile aynı kural). */
export function epostaGecerliMi(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email ?? "").trim().toLowerCase());
}

/**
 * Kodu maskele: hiçbir zaman tam kod günlüğe/görsele düşmesin.
 * `123456` → `123•••`
 */
export function koduMaskele(kod: string): string {
  const temiz = koduTemizle(kod);
  if (temiz.length < 3) return "•••";
  return `${temiz.slice(0, 3)}•••`;
}
