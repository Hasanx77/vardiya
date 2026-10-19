import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, cerezAyarlari, sifreDogruMu } from "@/lib/auth";
import { oturumTokeni } from "@/lib/session";
import { disAdres, guvenliHedef, httpsMi } from "@/lib/url";
import { denemeBasarisiz, denemeIzinli, denemeTemizle } from "@/lib/rate-limit";

/** Giriş yap: e-posta + şifre. Şifre özeti scrypt ile karşılaştırılır. */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const sifre = String(form.get("sifre") ?? "");
  const next = guvenliHedef(String(form.get("next") ?? "/panel"));
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "yerel";
  const anahtar = `${ip}|${email}`;

  const hata = (mesaj: string) => {
    const url = disAdres(req, "/giris");
    url.searchParams.set("hata", mesaj);
    if (email) url.searchParams.set("email", email);
    url.searchParams.set("next", next);
    return NextResponse.redirect(url, 303);
  };

  if (!email || !sifre) return hata("E-posta ve şifre gerekli.");

  if (!denemeIzinli(anahtar)) {
    return hata("Çok fazla hatalı deneme. 10 dakika sonra tekrar dene.");
  }

  const kullanici = await prisma.user.findUnique({ where: { email } });
  if (!kullanici || !sifreDogruMu(sifre, kullanici.passwordHash)) {
    denemeBasarisiz(anahtar);
    return hata("E-posta veya şifre hatalı.");
  }

  denemeTemizle(anahtar);

  await prisma.user.update({
    where: { id: kullanici.id },
    data: { lastLoginAt: new Date() },
  });

  const res = NextResponse.redirect(disAdres(req, next), 303);
  res.cookies.set(COOKIE_NAME, await oturumTokeni(kullanici.id), cerezAyarlari(httpsMi(req)));
  return res;
}
