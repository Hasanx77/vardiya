import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, tokenKullanici } from "@/lib/session";

/**
 * Oturum kapısı + HTTPS zorlaması.
 *
 * Açık (herkese görünür) yollar:
 *   /            → tanıtım sayfası
 *   /giris       → giriş
 *   /kayit       → kayıt ol
 *   /hakkimizda, /yardim, /gizlilik, /iletisim
 *   /robots.txt, /sitemap.xml, /manifest.webmanifest, /icons/*
 *   /ekip/<id>   → personelin salt-okunur programı (paylaşılabilir bağlantı)
 *   /api/auth/*, /api/ekip/<id>, /api/calendar/<id>, /api/iletisim
 *
 * Geri kalan **uygulama** sayfaları (panel, bugun, raporlar, takvim, /ekip listesi,
 * yazdir, profil, basla, mesajlar ve diğer /api/*) geçerli bir oturum çerezi ister.
 *
 * Bilinmeyen adresler bilinçli olarak geçirilir → 404 sayfası gösterilir.
 * (Eskiden her bilinmeyen adres /giris'e yönleniyordu; kırık bağlantı
 *  ziyaretçiyi giriş sayfasına atıyordu.)
 */
const PUBLIC_PATHS = new Set([
  "/",
  "/demo",
  "/giris",
  "/kayit",
  "/gizlilik",
  "/personel-aydinlatma",
  "/yardim",
  "/hakkimizda",
  "/iletisim",
]);

const PUBLIC_PREFIXES = [
  "/api/auth/",
  "/api/ekip/",
  "/api/calendar/",
  "/api/iletisim",
  "/icons/",
  "/_next/",
];

const PUBLIC_FILES = [
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-icon.png",
  "/og.png",
];

/** Oturum gerektiren uygulama sayfaları. */
const KORUMALI_ONEKLER = [
  "/panel",
  "/bugun",
  "/raporlar",
  "/takvim",
  "/yazdir",
  "/profil",
  "/basla",
  "/mesajlar",
];

/** /ekip/<tek-parça-id> → personel bağlantısı. /ekip listesi kapalı kalır. */
const EKIP_BAGLANTISI = /^\/ekip\/[^/]+\/?$/;

function acikMi(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_FILES.includes(pathname)) return true;
  if (EKIP_BAGLANTISI.test(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function korumaliMi(pathname: string): boolean {
  if (pathname === "/ekip") return true;
  // Açık API uçları yukarıda elendi; kalan tüm API'ler oturum ister.
  if (pathname === "/api" || pathname.startsWith("/api/")) return true;
  return KORUMALI_ONEKLER.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // HTTP → HTTPS. Ters vekil `x-forwarded-proto` başlığını HTTP'de "http",
  // HTTPS'te "https" olarak iletiyor (canlıda doğrulandı). Acil bir durumda
  // kapatabilmek için `HTTPS_ZORLA=0` ile devre dışı bırakılabilir.
  // Yerel/özel adreslerde ve başlık yoksa yönlendirme yapılmaz: döngü riski yok.
  const proto = (req.headers.get("x-forwarded-proto") ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  const yerelAdres =
    !host ||
    host.startsWith("localhost") ||
    host.startsWith("127.") ||
    host.startsWith("[::1]") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (
    process.env.HTTPS_ZORLA !== "0" &&
    process.env.NODE_ENV === "production" &&
    proto === "http" &&
    !yerelAdres
  ) {
    const hedef = new URL(`${pathname}${req.nextUrl.search}`, `https://${host}`);
    return NextResponse.redirect(hedef, 308);
  }

  if (acikMi(pathname)) return NextResponse.next();

  // Bilinmeyen sayfa → dokunma, Next 404 sayfasını göstersin.
  if (!korumaliMi(pathname)) return NextResponse.next();

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
  // Sorgu dizesini de koru (ör. /raporlar?ay=2026-10 → giriş sonrası aynı sayfa).
  const hedef = `${pathname}${req.nextUrl.search}`;
  url.search = `?next=${encodeURIComponent(hedef)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
