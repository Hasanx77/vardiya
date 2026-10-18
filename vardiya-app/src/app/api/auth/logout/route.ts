import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

/**
 * Çıkış: çerezi siler ve tanıtım sayfasına döner.
 * (Ters vekil arkasında olduğumuz için dış adresi x-forwarded-host'tan alıyoruz.)
 */
function disAdres(req: Request, yol: string): URL {
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return new URL(`${proto}://${host}${yol}`);
  return new URL(yol, req.url);
}

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
