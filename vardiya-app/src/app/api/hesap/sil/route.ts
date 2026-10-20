import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/session";
import { disAdres } from "@/lib/url";

/**
 * Hesabımı ve tüm verilerimi sil (unutulma hakkı).
 *
 * Kullanıcı silinince şema gereği işletmesi ve ona bağlı **tüm** kayıtlar
 * (personel, vardiyalar, şablonlar, duyurular, notlar) otomatik silinir.
 * Geri alınamaz — bu yüzden arayüzde onay istenir.
 */
export async function POST(req: Request) {
  const kullanici = await aktifKullanici();
  if (!kullanici) {
    const res = NextResponse.redirect(disAdres(req, "/giris"), 303);
    res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return res;
  }

  try {
    await prisma.user.delete({ where: { id: kullanici.id } });
  } catch (e) {
    // Zaten silinmişse (P2025) aynı sonucu ver: çerez temizlenip çıkış yapılır.
    if ((e as { code?: string })?.code !== "P2025") throw e;
  }

  const res = NextResponse.redirect(disAdres(req, "/?hesap=silindi"), 303);
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
