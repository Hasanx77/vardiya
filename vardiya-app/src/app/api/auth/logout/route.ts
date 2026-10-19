import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/session";
import { disAdres } from "@/lib/url";

/** Çıkış: oturum çerezini siler ve tanıtım sayfasına döner. */
function cikis(req: Request) {
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
