import { NextResponse } from "next/server";
import { disAdres, guvenliHedef, httpsMi } from "@/lib/url";
import {
  GOOGLE_DURUM_COOKIE,
  durumUret,
  googleAdresi,
  googleHazirMi,
  pkceUret,
} from "@/lib/google";

/** Google ile girişi başlatır: state + PKCE üretip Google'a yönlendirir. */
export async function GET(req: Request) {
  const hedef = guvenliHedef(new URL(req.url).searchParams.get("next") ?? "/panel", "/panel");

  if (!googleHazirMi()) {
    // Yapılandırma yok: kullanıcıyı sessizce giriş sayfasına döndür.
    const url = disAdres(req, "/giris");
    url.searchParams.set("hata", "Google ile giriş şu an kullanılamıyor.");
    return NextResponse.redirect(url, 303);
  }

  const { verifier, challenge } = pkceUret();
  const durum = durumUret();
  const yonlendirme = disAdres(req, "/api/auth/google/callback").toString();

  const res = NextResponse.redirect(
    googleAdresi({ yonlendirmeAdresi: yonlendirme, durum, challenge }),
    303,
  );

  // state + verifier + dönüş adresi tek çerezde: 10 dakika, httpOnly.
  res.cookies.set(
    GOOGLE_DURUM_COOKIE,
    JSON.stringify({ durum, verifier, hedef }),
    { httpOnly: true, sameSite: "lax", secure: httpsMi(req), path: "/", maxAge: 600 },
  );

  return res;
}
