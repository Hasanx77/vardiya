import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, tokenKullanici } from "@/lib/session";

/**
 * Oturum kapısı.
 *
 * Açık (herkese görünür) yollar:
 *   /            → tanıtım sayfası
 *   /giris       → giriş
 *   /kayit       → kayıt ol
 *   /gizlilik, /yardim, /robots.txt, /manifest.webmanifest, /icons/*
 *   /api/auth/*  → giriş/kayıt/çıkış uçları
 *
 * Geri kalan her şey (panel, bugun, raporlar, takvim, ekip, yazdir, tüm diğer /api/*)
 * geçerli bir oturum çerezi ister. Aksi halde /giris'e yönlendirilir.
 */
const PUBLIC_PATHS = new Set(["/", "/giris", "/kayit", "/gizlilik", "/yardim"]);

const PUBLIC_PREFIXES = ["/api/auth/", "/icons/", "/_next/"];

const PUBLIC_FILES = [
  "/favicon.ico",
  "/robots.txt",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-icon.png",
];

function acikMi(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_FILES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (acikMi(pathname)) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (await tokenKullanici(token)) return NextResponse.next();

  // API isteklerine HTML sayfası döndürmek anlamsız → 401 JSON
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { hata: "Oturum gerekli", girisAdresi: "/giris" },
      { status: 401 },
    );
  }

  const url = req.nextUrl.clone();
  url.pathname = "/giris";
  url.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
