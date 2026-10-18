import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";

/**
 * Şifre kapısı.
 *
 * Açık (herkese görünür) yollar:
 *   /            → tanıtım sayfası
 *   /giris       → şifre ekranı
 *   /api/auth/*  → giriş/çıkış
 *   /gizlilik, /yardim, /robots.txt, /manifest.webmanifest, /icons/*
 *
 * Geri kalan her şey (panel, bugun, raporlar, takvim, ekip, yazdir, tüm /api/*)
 * oturum çerezi ister. Aksi halde /giris'e yönlendirilir.
 */
const PUBLIC_PATHS = new Set(["/", "/giris", "/gizlilik", "/yardim"]);

const PUBLIC_PREFIXES = ["/api/auth/", "/icons/", "/_next/"];

const PUBLIC_FILES = [
  "/favicon.ico",
  "/robots.txt",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-icon.png",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_FILES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (await verifyToken(token)) return NextResponse.next();

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
