import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, tokenKullanici } from "@/lib/session";

/**
 * Oturum kapısı.
 *
 * Açık (herkese görünür) yollar:
 *   /            → tanıtım sayfası
 *   /giris       → giriş
 *   /kayit       → kayıt ol
 *   /gizlilik, /yardim, /hakkimizda, /robots.txt, /manifest.webmanifest, /icons/*
 *   /ekip/<id>   → personelin salt-okunur programı (paylaşılabilir bağlantı)
 *   /api/auth/*, /api/ekip/<id>, /api/calendar/<id> → aynı amaca hizmet eden uçlar
 *
 * Geri kalan her şey (panel, bugun, raporlar, takvim, /ekip listesi, yazdir,
 * tüm diğer /api/*) geçerli bir oturum çerezi ister. Aksi halde /giris'e yönlendirilir.
 */
const PUBLIC_PATHS = new Set(["/", "/giris", "/kayit", "/gizlilik", "/yardim", "/hakkimizda"]);

const PUBLIC_PREFIXES = ["/api/auth/", "/api/ekip/", "/api/calendar/", "/icons/", "/_next/"];

const PUBLIC_FILES = [
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-icon.png",
  "/og.png",
];

/** /ekip/<tek-parça-id> → personel bağlantısı. /ekip listesi kapalı kalır. */
const EKIP_BAGLANTISI = /^\/ekip\/[^/]+\/?$/;

function acikMi(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_FILES.includes(pathname)) return true;
  if (EKIP_BAGLANTISI.test(pathname)) return true;
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
