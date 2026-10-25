/**
 * Şifre sıfırlama anahtarları.
 *
 * Tasarım kararı: **ham anahtar veritabanına yazılmaz**, yalnızca SHA-256 özeti
 * saklanır. Veritabanı sızsa bile e-posta bağlantısı kullanılamaz. Anahtar tek
 * kullanımlıktır ve yeni istek geldiğinde eskiler silinir.
 */
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { sifreOzetle } from "./auth";

/** Bağlantı ömrü (dakika). */
export const SIFIRLAMA_GECERLILIK_DK = 60;

function ozetle(anahtar: string): string {
  return createHash("sha256").update(anahtar).digest("hex");
}

export type YeniAnahtar = { anahtar: string; dakika: number };

/** Kullanıcı için yeni tek kullanımlık anahtar üretir (eskiler geçersizleşir). */
export async function sifirlamaAnahtariOlustur(userId: string): Promise<YeniAnahtar> {
  const anahtar = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SIFIRLAMA_GECERLILIK_DK * 60_000);

  await prisma.$transaction([
    // Kullanılmamış eski bağlantılar ölür: tek aktif bağlantı kuralı.
    prisma.passwordReset.deleteMany({ where: { userId, usedAt: null } }),
    prisma.passwordReset.create({
      data: { userId, tokenHash: ozetle(anahtar), expiresAt },
    }),
  ]);

  return { anahtar, dakika: SIFIRLAMA_GECERLILIK_DK };
}

/** Anahtar geçerli mi? (kullanılmamış + süresi dolmamış) */
export async function sifirlamaAnahtariGecerliMi(
  anahtar: string,
): Promise<{ id: string; userId: string } | null> {
  const temiz = (anahtar ?? "").trim();
  if (temiz.length < 20) return null;

  const kayit = await prisma.passwordReset.findUnique({
    where: { tokenHash: ozetle(temiz) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!kayit || kayit.usedAt) return null;
  if (kayit.expiresAt.getTime() < Date.now()) return null;
  return { id: kayit.id, userId: kayit.userId };
}

/**
 * Anahtarı tüketip şifreyi değiştirir.
 *
 * `sessionVersion` artırılır → kullanıcının **tüm eski cihaz oturumları ölür**
 * (şifre çalınmışsa saldırganın oturumu da kapanır).
 */
export async function sifreyiSifirla(
  anahtar: string,
  yeniSifre: string,
): Promise<boolean> {
  const gecerli = await sifirlamaAnahtariGecerliMi(anahtar);
  if (!gecerli) return false;

  const yeniOzet = await sifreOzetle(yeniSifre);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: gecerli.userId },
      data: { passwordHash: yeniOzet, sessionVersion: { increment: 1 } },
    }),
    prisma.passwordReset.update({
      where: { id: gecerli.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordReset.deleteMany({
      where: { userId: gecerli.userId, usedAt: null },
    }),
  ]);

  return true;
}

/** Kullanıcının görünen adı (e-posta değil). */
export function gorunenAd(kullanici: {
  username?: string | null;
  email: string;
}): string {
  return (kullanici.username ?? "").trim() || kullanici.email.split("@")[0];
}
