import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, tokenKullanici } from "@/lib/session";
import { guvenliHost } from "@/lib/url";
import { TEMA_BETIGI_HASH } from "@/lib/tema-betik";

/**
 * Oturum kapısı + HTTPS zorlaması + İçerik Güvenliği Politikası (CSP).
 *
 * Açık (herkese görünür) yollar:
 *   /            → tanıtım sayfası
 *   /giris       → giriş
 *   /kayit       → kayıt ol
 *   /iki-adim    → iki adımlı doğrulama
 *   /hakkimizda, /yardim, /gizlilik, /iletisim
 *   /robots.txt, /sitemap.xml, /manifest.webmanifest, /icons/*
 *   /ekip/<id>   → personelin salt-okunur programı (paylaşılabilir bağlantı)
 *   /api/auth/*, /api/ekip/<id>, /api/calendar/<id>, /api/iletisim
 *
 * Geri kalan **uygulama** sayfaları (panel, bugun, raporlar, takvim, /ekip listesi,
 * yazdir, profil, basla, mesajlar ve diğer /api/*) geçerli bir oturum çerezi ister.
 *
 * Bilinmeyen adresler bilinçli olarak geçirilir → 404 sayfası gösterilir.
 */
const PUBLIC_PATHS = new Set([
  "/",
  "/demo",
  "/giris",
  "/kayit",
  "/iki-adim",
  "/gizlilik",
  "/personel-aydinlatma",
  "/yardim",
  "/hakkimizda",
  "/iletisim",
]);

const PUBLIC_PREFIXES = [
  "/sifre-sifirla",
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

/* ------------------------------------------------------------------ *
 * İçerik Güvenliği Politikası (CSP)
 *
 * İki seviye:
 *  1) **Sıkı (nonce)**: giriş yapılmış uygulama sayfaları ve auth sayfaları.
 *     Bu sayfalar sunucuda her istekte üretildiği için Next kendi gömülü
 *     betiklerine rastgele `nonce` ekleyebiliyor → `'unsafe-inline'` gerekmez.
 *     XSS bulunsa bile saldırganın enjekte ettiği `<script>` çalışmaz.
 *  2) **Gevşek (mevcut)**: ön-render edilen tanıtım sayfaları (/, /hakkimizda…).
 *     Statik HTML'e nonce eklenemediği için `'unsafe-inline'` korunur; bu
 *     sayfalarda form/hesap verisi yok, risk düşük.
 * ------------------------------------------------------------------ */
const ORTAK_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https://www.gstatic.com https://*.gstatic.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline' https://accounts.google.com",
  "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com",
  "frame-src https://accounts.google.com",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
];

/** Nonce gerektirmeyen (statik) sayfalar. */
const STATIK_SAYFALAR = new Set([
  "/",
  "/hakkimizda",
  "/yardim",
  "/gizlilik",
  "/iletisim",
  "/demo",
  "/personel-aydinlatma",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
]);

function nonceUret(): string {
  const baytlar = new Uint8Array(16);
  crypto.getRandomValues(baytlar);
  let ikili = "";
  for (const b of baytlar) ikili += String.fromCharCode(b);
  return btoa(ikili).replace(/=+$/, "");
}

function cspUret(nonce: string | null): string {
  const gelistirme = process.env.NODE_ENV !== "production";
  const betik = nonce
    ? `script-src 'self' 'nonce-${nonce}' '${TEMA_BETIGI_HASH}' https://accounts.google.com${gelistirme ? " 'unsafe-eval'" : ""}`
    : `script-src 'self' 'unsafe-inline' https://accounts.google.com${gelistirme ? " 'unsafe-eval'" : ""}`;
  const ek = gelistirme ? ["connect-src 'self' ws: wss: https://accounts.google.com https://oauth2.googleapis.com"] : [];
  return [...ORTAK_CSP.filter((d) => !(gelistirme && d.startsWith("connect-src"))), betik, ...ek].join("; ");
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

  // Statik tanıtım sayfalarında nonce kullanılamaz (HTML derleme anında üretilir).
  const sikiCsp = !STATIK_SAYFALAR.has(pathname);
  const nonce = sikiCsp ? nonceUret() : null;
  const csp = cspUret(nonce);

  /** Yanıta CSP başlığını ekler (yönlendirmeler ve hata yanıtları dahil). */
  const imzala = (res: NextResponse) => {
    res.headers.set("Content-Security-Policy", csp);
    if (nonce) res.headers.set("x-nonce", nonce);
    return res;
  };

  /** İsteği, Next'in gömülü betiklere nonce ekleyebilmesi için başlıklarla sürdürür. */
  const devam = () => {
    if (!nonce) return imzala(NextResponse.next());
    const basliklar = new Headers(req.headers);
    basliklar.set("x-nonce", nonce);
    basliklar.set("Content-Security-Policy", csp);
    return imzala(NextResponse.next({ request: { headers: basliklar } }));
  };

  if (
    process.env.HTTPS_ZORLA !== "0" &&
    process.env.NODE_ENV === "production" &&
    proto === "http" &&
    !yerelAdres
  ) {
    const hedef = new URL(`${pathname}${req.nextUrl.search}`, `https://${guvenliHost(host)}`);
    return imzala(NextResponse.redirect(hedef, 308));
  }

  // CSRF: tarayıcıdan gelen yazma isteklerinde Origin aynı sitede olmalı.
  // (Origin yoksa curl/API istemcisi kabul edilir; çerez zaten SameSite=lax.)
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = (req.headers.get("origin") ?? "").trim();
    if (origin) {
      // Bazı gizlilik eklentileri/ayarları aynı siteli form gönderimlerinde
      // `Origin: null` yazıyor (Opera'da görüldü). Bu durumda tarayıcının
      // kendi gönderdiği `Sec-Fetch-Site` başlığına güveniyoruz — bu başlık
      // sayfa tarafından taklit edilemez.
      if (origin.toLowerCase() === "null") {
        const site = (req.headers.get("sec-fetch-site") ?? "same-origin").toLowerCase();
        if (site !== "same-origin" && site !== "none") {
          return imzala(new NextResponse("Çapraz kaynaklı istek reddedildi.", { status: 403 }));
        }
      } else {
        try {
          const originHost = new URL(origin).host.toLowerCase();
          // Google ile giriş (GSI "redirect" modu): Google, ID token'ı **kendi
          // sayfasından** form POST ile gönderir → Origin accounts.google.com olur.
          // Yalnız bu uç için izin veriyoruz; token ayrıca Google'a doğrulatılıyor.
          const googleFormu =
            pathname === "/api/auth/google/gsi" && originHost === "accounts.google.com";
          if (originHost !== guvenliHost(host) && !googleFormu) {
            return imzala(new NextResponse("Çapraz kaynaklı istek reddedildi.", { status: 403 }));
          }
        } catch {
          return imzala(new NextResponse("Geçersiz Origin başlığı.", { status: 403 }));
        }
      }
    }
  }

  // Görsel iyileştirici (/_next/image) bilinçli olarak KAPALI: uygulamada
  // `next/image` kullanılmıyor. Next 16.4.1 öncesinde bu uçta kritik bir RCE
  // (CVE-2026-96889) vardı; sürümü yükselttik ama kullanılmayan ucu kapatmak
  // saldırı yüzeyini tamamen kaldırır. (Açık yol kontrolünden ÖNCE bakılır.)
  if (pathname.startsWith("/_next/image")) {
    return imzala(new NextResponse("Bulunamadı", { status: 404 }));
  }

  if (acikMi(pathname)) return devam();

  // Bilinmeyen sayfa → dokunma, Next 404 sayfasını göstersin.
  if (!korumaliMi(pathname)) return devam();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (await tokenKullanici(token)) return devam();

  // API isteklerine HTML sayfası döndürmek anlamsız → 401 JSON
  if (pathname.startsWith("/api/")) {
    return imzala(
      NextResponse.json({ hata: "Oturum gerekli", girisAdresi: "/giris" }, { status: 401 }),
    );
  }

  const url = req.nextUrl.clone();
  url.pathname = "/giris";
  // Sorgu dizesini de koru (ör. /raporlar?ay=2026-10 → giriş sonrası aynı sayfa).
  const hedef = `${pathname}${req.nextUrl.search}`;
  url.search = `?next=${encodeURIComponent(hedef)}`;
  return imzala(NextResponse.redirect(url));
}

export const config = {
  matcher: ["/((?!_next/static|favicon.ico).*)"],
};
