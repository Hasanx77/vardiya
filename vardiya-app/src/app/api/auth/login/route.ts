import { NextResponse } from "next/server";
import { COOKIE_MAX_AGE, COOKIE_NAME, checkPassword, createToken } from "@/lib/auth";

/** Güvenli olmayan dış adreslere yönlendirmeyi engelle. */
function guvenliHedef(next: string): string {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/panel";
}

/**
 * Yönlendirme adresi.
 *
 * Neden gerekli: uygulama cPanel'de ters vekil (LiteSpeed/Passenger) arkasında
 * ve UNIX soketinde çalışıyor. Bu yüzden isteğin kendi adresi "localhost:3000"
 * olur; tarayıcıyı oraya gönderirsek giriş kırılır. Bu yüzden dışarıdan görünen
 * alan adını (x-forwarded-host) kullanıyoruz.
 */
function disAdres(req: Request, yol: string): URL {
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return new URL(`${proto}://${host}${yol}`);
  return new URL(yol, req.url);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const sifre = String(form.get("sifre") ?? "");
  const next = guvenliHedef(String(form.get("next") ?? "/panel"));

  if (!checkPassword(sifre)) {
    const url = disAdres(req, "/giris");
    url.searchParams.set("hata", "1");
    url.searchParams.set("next", next);
    return NextResponse.redirect(url, 303);
  }

  const res = NextResponse.redirect(disAdres(req, next), 303);

  // HTTPS'de güvenli çerez; ama HTTP üzerinden yayına alınırsa kilitlenmeyelim.
  const proto =
    req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");

  res.cookies.set(COOKIE_NAME, await createToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: proto === "https",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}
