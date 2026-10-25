/**
 * Hesap katmanı (yalnızca sunucuda çalışır).
 *
 * - Şifreler **scrypt** ile tuzlanarak özetlenir; düz metin asla saklanmaz.
 * - Oturum çerezi `lib/session.ts` ile imzalanır (Edge uyumlu).
 * - `aktifKullanici()` istekteki çerezden kullanıcıyı bulur.
 *
 * Gizlilik notu: şifre özeti ve e-posta dışında kişisel veri toplanmaz.
 * Veriler yalnızca bu sunucudaki veritabanında tutulur; üçüncü tarafa gönderilmez.
 */
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { COOKIE_NAME, COOKIE_MAX_AGE, tokenBilgi } from "./session";

export { COOKIE_NAME, COOKIE_MAX_AGE };

const TUZ_UZUNLUK = 16;
const OZET_UZUNLUK = 64;

/**
 * `scrypt` callback tabanlı; promisify ile asenkron sürüme çevriliyor.
 *
 * Neden senkron değil: senkron scrypt her çağrıda event loop'u ~50-100 ms bloke
 * eder. Paylaşımlı sunucuda tek CPU (`cpus: 1`) olduğundan birkaç eşzamanlı
 * giriş isteği tüm siteyi yavaşlatıp durdurabiliyordu.
 */
const scryptAsync = promisify(scrypt) as (
  sifre: string,
  tuz: string,
  uzunluk: number,
) => Promise<Buffer>;

/** Şifreyi `scrypt$tuz$özet` biçiminde saklar. */
export async function sifreOzetle(sifre: string): Promise<string> {
  const tuz = randomBytes(TUZ_UZUNLUK).toString("hex");
  const ozet = await scryptAsync(sifre, tuz, OZET_UZUNLUK);
  return `scrypt$${tuz}$${ozet.toString("hex")}`;
}

/** Girilen şifre, kayıtlı özetle uyuşuyor mu? (sabit zamanlı karşılaştırma) */
export async function sifreDogruMu(sifre: string, kayit: string): Promise<boolean> {
  const [algo, tuz, ozet] = (kayit || "").split("$");
  if (algo !== "scrypt" || !tuz || !ozet) return false;
  const hesaplanan = await scryptAsync(sifre, tuz, OZET_UZUNLUK);
  const beklenen = Buffer.from(ozet, "hex");
  if (hesaplanan.length !== beklenen.length) return false;
  return timingSafeEqual(hesaplanan, beklenen);
}

/** E-posta biçimi + şifre uzunluğu denetimi. */
export function girdilerGecerliMi(email: string, sifre: string): string | null {
  const temiz = (email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(temiz)) return "Geçerli bir e-posta adresi gir.";
  if (!sifre || sifre.length < 8) return "Şifre en az 8 karakter olmalı.";
  if (sifre.length > 200) return "Şifre çok uzun.";
  return null;
}

/** İstekteki oturumdan kullanıcı id'si (yoksa null). */
export async function aktifKullaniciId(): Promise<string | null> {
  const c = await cookies();
  const bilgi = await tokenBilgi(c.get(COOKIE_NAME)?.value);
  if (!bilgi) return null;

  // Şifre değişince sürüm artar; eski çerezler burada reddedilir.
  const kullanici = await prisma.user.findUnique({
    where: { id: bilgi.kullaniciId },
    select: { id: true, sessionVersion: true },
  });
  if (!kullanici || kullanici.sessionVersion !== bilgi.version) return null;
  return kullanici.id;
}

/** Oturumdaki kullanıcı kaydı (yoksa null). */
export async function aktifKullanici() {
  const id = await aktifKullaniciId();
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

/** Çerez ayarlarını tek yerde tutar (giriş/kayıt uçları kullanır).
 *  `hatirla=false` → oturum çerezi (tarayıcı kapanınca silinir). */
export function cerezAyarlari(https: boolean, hatirla = true) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: https,
    path: "/",
    ...(hatirla ? { maxAge: COOKIE_MAX_AGE } : {}),
  };
}
