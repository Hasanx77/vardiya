import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aktifKullaniciId, sifreDogruMu, sifreOzetle } from "@/lib/auth";
import { disAdres } from "@/lib/url";

/**
 * Şifre değiştir (giriş yapmış kullanıcı).
 * Mevcut şifre doğrulanmadan yeni şifre atanmaz.
 */
export async function POST(req: Request) {
  const kullaniciId = await aktifKullaniciId();
  if (!kullaniciId) return NextResponse.redirect(disAdres(req, "/giris"), 303);

  const form = await req.formData();
  const mevcut = String(form.get("mevcut") ?? "");
  const yeni = String(form.get("yeni") ?? "");
  const yeniTekrar = String(form.get("yeniTekrar") ?? "");

  const hata = (mesaj: string) => {
    const url = disAdres(req, "/profil");
    url.searchParams.set("sifreHata", mesaj);
    return NextResponse.redirect(url, 303);
  };

  if (yeni.length < 8) return hata("Yeni şifre en az 8 karakter olmalı.");
  if (yeni !== yeniTekrar) return hata("Yeni şifreler birbiriyle uyuşmuyor.");

  const kullanici = await prisma.user.findUnique({ where: { id: kullaniciId } });
  if (!kullanici || !sifreDogruMu(mevcut, kullanici.passwordHash)) {
    return hata("Mevcut şifre hatalı.");
  }

  await prisma.user.update({
    where: { id: kullaniciId },
    data: { passwordHash: sifreOzetle(yeni) },
  });

  const url = disAdres(req, "/profil");
  url.searchParams.set("sifreOk", "1");
  return NextResponse.redirect(url, 303);
}
