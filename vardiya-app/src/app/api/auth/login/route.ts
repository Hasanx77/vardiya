import { NextResponse } from "next/server";
import { COOKIE_MAX_AGE, COOKIE_NAME, checkPassword, createToken } from "@/lib/auth";

/** Güvenli olmayan dış adreslere yönlendirmeyi engelle. */
function guvenliHedef(next: string): string {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/panel";
}

export async function POST(req: Request) {
  const form = await req.formData();
  const sifre = String(form.get("sifre") ?? "");
  const next = guvenliHedef(String(form.get("next") ?? "/panel"));

  if (!checkPassword(sifre)) {
    const url = new URL("/giris", req.url);
    url.searchParams.set("hata", "1");
    url.searchParams.set("next", next);
    return NextResponse.redirect(url, 303);
  }

  const res = NextResponse.redirect(new URL(next, req.url), 303);

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
