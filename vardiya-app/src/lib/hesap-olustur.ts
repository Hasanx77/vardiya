/**
 * Hesap açma — tek yer.
 *
 * Kayıt formu, Google ile giriş ve (ileride) davet akışı aynı işi yapar:
 * kullanıcı + boş işletme + standart vardiya şablonları. Tekrar etmesin.
 */
import { prisma } from "./prisma";
import { standartSablonlar } from "./shifts";
import { epostadanAd, siraylaAd } from "./kullanici-adi";

export type YeniHesap = {
  email: string;
  passwordHash: string;
  username?: string | null;
  isletme?: string;
  emailVerified?: boolean;
  googleId?: string | null;
};

/** Kullanıcı adı başkasında mı? */
export async function kullaniciAdiAlinmisMi(ad: string): Promise<boolean> {
  const varOlan = await prisma.user.findUnique({ where: { username: ad }, select: { id: true } });
  return Boolean(varOlan);
}

/** Boşta olan ilk adı bulur (`hasan`, `hasan2`, `hasan3`…). */
export async function bosAdBul(taban: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const aday = siraylaAd(taban, i);
    if (!(await kullaniciAdiAlinmisMi(aday))) return aday;
  }
  // Son çare: rastgele son ek (çakışma olasılığı yok denecek kadar az).
  return siraylaAd(taban, Math.floor(Math.random() * 900) + 100);
}

/**
 * Kullanıcı + işletme + şablonları **tek işlemde** oluşturur.
 * Yarıda hata olursa "işletmesi olmayan hesap" kalmaz.
 */
export async function hesapOlustur(girdi: YeniHesap) {
  const ad = girdi.username?.trim() || (await bosAdBul(epostadanAd(girdi.email)));

  return prisma.$transaction(async (tx) => {
    const kullanici = await tx.user.create({
      data: {
        email: girdi.email,
        passwordHash: girdi.passwordHash,
        username: ad,
        googleId: girdi.googleId ?? null,
        emailVerifiedAt: girdi.emailVerified ? new Date() : null,
        lastLoginAt: new Date(),
      },
    });

    const business = await tx.business.create({
      data: {
        userId: kullanici.id,
        name: girdi.isletme?.trim() || "İşletmem",
        openTime: "09:00",
        closeTime: "23:00",
      },
    });

    await tx.shiftTemplate.createMany({
      data: standartSablonlar(business.openTime, business.closeTime).map((s) => ({
        businessId: business.id,
        name: s.name,
        start: s.start,
        end: s.end,
        color: s.color,
        minStaff: s.minStaff,
      })),
    });

    return kullanici;
  });
}
