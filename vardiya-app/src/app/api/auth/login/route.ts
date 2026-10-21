import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, cerezAyarlari, sifreDogruMu, sifreOzetle } from "@/lib/auth";
import { oturumAltyapisiHazir, oturumTokeni } from "@/lib/session";
import { disAdres, guvenliHedef, httpsMi, istemciIp } from "@/lib/url";
import { denemeBasarisiz, denemeIzinli, denemeTemizle } from "@/lib/rate-limit";

/**
 * Kullanıcı bulunamadığında da scrypt çalıştırmak için sahte özet.
 * Böylece yanıt süresi, e-postanın kayıtlı olup olmadığını ele vermez.
 */
const SAHTE_OZET = sifreOzetle("gecersiz-sifre-zamani-esitle");

/** Giriş yap: e-posta + şifre. Şifre özeti scrypt ile karşılaştırılır. */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const sifre = String(form.get("sifre") ?? "");
  let next = guvenliHedef(String(form.get("next") ?? "/panel"));
  if (next.startsWith("/giris") || next.startsWith("/kayit")) next = "/panel";
  const ip = istemciIp(req);
  const anahtar = `${ip}|${email}`;

  const hata = (mesaj: string) => {
    const url = disAdres(req, "/giris");
    url.searchParams.set("hata", mesaj);
    if (email) url.searchParams.set("email", email);
    url.searchParams.set("next", next);
    return NextResponse.redirect(url, 303);
  };

  if (!email || !sifre) return hata("E-posta ve şifre gerekli.");

  // Oturum anahtarı yoksa çerez imzalanamaz → giriş "başarılı" görünse bile
  // kullanıcı giriş yapmamış sayılırdı. Bunu sessizce yaşatmak yerine söyle.
  if (!oturumAltyapisiHazir()) {
    return hata("Sunucu yapılandırması eksik (oturum anahtarı). Lütfen yöneticiye bildir.");
  }

  if (!denemeIzinli(anahtar)) {
    return hata("Çok fazla hatalı deneme. 10 dakika sonra tekrar dene.");
  }

  const kullanici = await prisma.user.findUnique({ where: { email } });
  let sifreDogru = false;
  if (kullanici) {
    sifreDogru = sifreDogruMu(sifre, kullanici.passwordHash);
  } else {
    // Sahte karşılaştırma: süre farkından hesap varlığı anlaşılmasın.
    sifreDogruMu(sifre, SAHTE_OZET);
  }

  if (!kullanici || !sifreDogru) {
    denemeBasarisiz(anahtar);
    return hata("E-posta veya şifre hatalı.");
  }

  denemeTemizle(anahtar);

  await prisma.user.update({
    where: { id: kullanici.id },
    data: { lastLoginAt: new Date() },
  });

  const res = NextResponse.redirect(disAdres(req, next), 303);
  res.cookies.set(COOKIE_NAME, await oturumTokeni(kullanici.id, kullanici.sessionVersion), cerezAyarlari(httpsMi(req)));
  return res;
}
