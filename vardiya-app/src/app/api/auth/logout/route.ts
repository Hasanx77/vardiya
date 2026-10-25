import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aktifKullaniciId } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/session";
import { disAdres } from "@/lib/url";

/**
 * Çıkış: oturumu **sunucuda** geçersiz kılar ve çerezi siler.
 *
 * Neden sürüm artırılıyor: oturum çerezi stateless (imzalı) ve 30 gün geçerli.
 * Yalnız çerezi silmek, çalınmış bir kopyayı durdurmaz — saldırgan kendi
 * kopyasıyla girmeye devam ederdi. `sessionVersion` artırılınca eski çerezdeki
 * sürüm uyuşmaz ve tüm eski cihazlar düşer.
 *
 * Veritabanı hata verse bile çıkış tamamlanır (çerez yine silinir): kullanıcı
 * ekranda kilitli kalmasın.
 */
async function oturumuGecersizKil(): Promise<void> {
  try {
    const kullaniciId = await aktifKullaniciId();
    if (!kullaniciId) return;
    await prisma.user.update({
      where: { id: kullaniciId },
      data: { sessionVersion: { increment: 1 } },
      select: { sessionVersion: true },
    });
  } catch (e) {
    console.error(
      "cikis: oturum gecersizlestirilemedi:",
      e instanceof Error ? e.message : String(e),
    );
  }
}

async function cikis(req: Request) {
  await oturumuGecersizKil();

  const res = NextResponse.redirect(disAdres(req, "/"), 303);
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}

export async function POST(req: Request) {
  return cikis(req);
}

/** Adres çubuğuna /api/auth/logout yazan biri de çıkış yapabilsin. */
export async function GET(req: Request) {
  return cikis(req);
}
