/**
 * Google hesabı ile giriş/kayıt ortak mantığı.
 *
 * İki akış da buraya bağlanır:
 *   - ID token (Google Identity Services) → secret gerekmez  ← kullanılan
 *   - Yetkilendirme kodu + PKCE (secret gerekir)             ← yedek
 *
 * Kural: aynı e-posta ile açılmış hesap varsa **birleştirilir**; kullanıcı
 * iki ayrı hesap açmak zorunda kalmaz.
 */
import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { sifreOzetle } from "./auth";
import { bosAdBul, hesapOlustur } from "./hesap-olustur";
import { standartSablonlar } from "./shifts";
import { epostadanAd } from "./kullanici-adi";

export type GoogleKimlik = {
  sub: string;
  email: string;
  emailVerified: boolean;
};

/** Google kimliğiyle oturum açılacak kullanıcıyı bulur veya oluşturur. */
export async function googleHesabiniBulVeyaAc(kimlik: GoogleKimlik) {
  let kullanici = await prisma.user.findUnique({ where: { googleId: kimlik.sub } });

  if (!kullanici) {
    const ayniEposta = await prisma.user.findUnique({ where: { email: kimlik.email } });

    if (ayniEposta) {
      kullanici = await prisma.user.update({
        where: { id: ayniEposta.id },
        data: {
          googleId: kimlik.sub,
          emailVerifiedAt: kimlik.emailVerified
            ? (ayniEposta.emailVerifiedAt ?? new Date())
            : ayniEposta.emailVerifiedAt,
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Google ile gelen kullanıcının şifresi yok: tahmin edilemez rastgele özet.
      const geciciSifre = randomBytes(32).toString("base64url");
      kullanici = await hesapOlustur({
        email: kimlik.email,
        passwordHash: await sifreOzetle(geciciSifre),
        username: await bosAdBul(epostadanAd(kimlik.email)),
        emailVerified: kimlik.emailVerified,
        googleId: kimlik.sub,
      });
    }
  } else {
    kullanici = await prisma.user.update({
      where: { id: kullanici.id },
      data: { lastLoginAt: new Date() },
    });
  }

  // Güvenlik ağı: hesabın işletmesi yoksa oluştur (eski kayıtlarda boşluk olabilir).
  const isletme = await prisma.business.findUnique({ where: { userId: kullanici.id } });
  if (!isletme) {
    const yeni = await prisma.business.create({
      data: { userId: kullanici.id, name: "İşletmem" },
    });
    await prisma.shiftTemplate.createMany({
      data: standartSablonlar(yeni.openTime, yeni.closeTime).map((s) => ({
        businessId: yeni.id,
        name: s.name,
        start: s.start,
        end: s.end,
        color: s.color,
        minStaff: s.minStaff,
      })),
    });
  }

  return kullanici;
}
