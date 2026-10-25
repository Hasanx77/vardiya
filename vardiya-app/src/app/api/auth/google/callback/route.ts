import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, cerezAyarlari, sifreOzetle } from "@/lib/auth";
import { oturumTokeni } from "@/lib/session";
import { disAdres, guvenliHedef, httpsMi } from "@/lib/url";
import { GOOGLE_DURUM_COOKIE, googleHazirMi, googleKullanicisi } from "@/lib/google";
import { bosAdBul, hesapOlustur } from "@/lib/hesap-olustur";
import { standartSablonlar } from "@/lib/shifts";
import { epostadanAd } from "@/lib/kullanici-adi";
import { randomBytes } from "node:crypto";

/**
 * Google'dan dönüş.
 *
 * Kullanıcı bulunamazsa **hesap açılır** (Google e-postası doğrulanmışsa
 * e-posta doğrulanmış sayılır). Var olan e-posta ile eşleşirse hesaplar
 * birleştirilir — kullanıcı iki ayrı hesap açmak zorunda kalmaz.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const hata = (mesaj: string) => {
    const hedef = disAdres(req, "/giris");
    hedef.searchParams.set("hata", mesaj);
    return NextResponse.redirect(hedef, 303);
  };

  if (!googleHazirMi()) return hata("Google ile giriş yapılandırılmadı.");

  const kod = url.searchParams.get("code") ?? "";
  const durum = url.searchParams.get("state") ?? "";
  if (url.searchParams.get("error")) return hata("Google girişi iptal edildi.");
  if (!kod || !durum) return hata("Google yanıtı eksik. Lütfen tekrar dene.");

  const cerez = await cookies();
  const ham = cerez.get(GOOGLE_DURUM_COOKIE)?.value ?? "";
  let durumBilgi: { durum?: string; verifier?: string; hedef?: string } = {};
  try {
    durumBilgi = JSON.parse(ham);
  } catch {
    return hata("Oturum bilgisi okunamadı. Lütfen tekrar dene.");
  }

  // CSRF: gelen state, çerezdeki state ile birebir aynı olmalı.
  if (!durumBilgi.durum || durumBilgi.durum !== durum || !durumBilgi.verifier) {
    return hata("Güvenlik doğrulaması başarısız. Lütfen tekrar dene.");
  }

  const hedef = guvenliHedef(durumBilgi.hedef ?? "/panel", "/panel");
  const yonlendirme = disAdres(req, "/api/auth/google/callback").toString();

  const google = await googleKullanicisi(kod, yonlendirme, durumBilgi.verifier);
  if (!google) return hata("Google hesabı doğrulanamadı. Lütfen tekrar dene.");

  let kullanici = await prisma.user.findUnique({ where: { googleId: google.sub } });

  if (!kullanici) {
    const ayniEposta = await prisma.user.findUnique({ where: { email: google.email } });

    if (ayniEposta) {
      // E-posta ile açılmış hesap → Google kimliğini bağla.
      kullanici = await prisma.user.update({
        where: { id: ayniEposta.id },
        data: {
          googleId: google.sub,
          emailVerifiedAt: google.emailVerified
            ? (ayniEposta.emailVerifiedAt ?? new Date())
            : ayniEposta.emailVerifiedAt,
        },
      });
    } else {
      // Yeni hesap: şifre rastgele (Google ile giriş yapacak), ad e-postadan.
      const geciciSifre = randomBytes(32).toString("base64url");
      kullanici = await hesapOlustur({
        email: google.email,
        passwordHash: await sifreOzetle(geciciSifre),
        username: await bosAdBul(epostadanAd(google.email)),
        emailVerified: google.emailVerified,
        googleId: google.sub,
      });
    }
  } else {
    // Var olan Google hesabı: son giriş zamanını güncelle.
    kullanici = await prisma.user.update({
      where: { id: kullanici.id },
      data: { lastLoginAt: new Date() },
    });
  }

  // Güvenlik ağı: hesap varsa işletmesi de olmalı (eski kayıtlarda boşluk olabilir).
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

  const res = NextResponse.redirect(
    disAdres(req, kullanici.onboardedAt ? hedef : "/basla"),
    303,
  );
  res.cookies.set(
    COOKIE_NAME,
    await oturumTokeni(kullanici.id, kullanici.sessionVersion),
    cerezAyarlari(httpsMi(req), true),
  );
  // Tek kullanımlık akış çerezi temizlenir.
  res.cookies.set(GOOGLE_DURUM_COOKIE, "", { path: "/", maxAge: 0 });

  return res;
}
