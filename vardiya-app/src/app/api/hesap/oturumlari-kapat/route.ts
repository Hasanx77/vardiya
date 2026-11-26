import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aktifKullaniciId, COOKIE_NAME } from "@/lib/auth";
import { disAdres } from "@/lib/url";

export const dynamic = "force-dynamic";

/**
 * **Tüm cihazlardan çıkış.**
 *
 * Oturum çerezi stateless olduğu için yalnız çerezi silmek yetmez; sürüm
 * artırılır ve dünyadaki tüm eski çerezler geçersiz olur.
 */
export async function POST(req: Request) {
  const kullaniciId = await aktifKullaniciId();
  if (kullaniciId) {
    try {
      await prisma.user.update({
        where: { id: kullaniciId },
        data: { sessionVersion: { increment: 1 } },
      });
    } catch (e) {
      console.error("oturumları kapat:", e);
    }
  }

  const icerik = (req.headers.get("content-type") ?? "").toLowerCase();
  if (icerik.includes("application/json")) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return res;
  }

  const res = NextResponse.redirect(disAdres(req, "/giris?tumCihazlar=1"), 303);
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
