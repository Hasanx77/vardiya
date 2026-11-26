import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { Geist_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import ProfilMenusu from "@/components/ProfilMenusu";
import { AltMenu, UstMenu } from "@/components/Menu";
import SiteMenusu from "@/components/SiteMenusu";
import Marka from "@/components/Marka";
import LogoV from "@/components/LogoV";
import UygulamaKabuk from "@/components/UygulamaKabuk";
import { aktifKullanici } from "@/lib/auth";
import { TEMA_BETIGI } from "@/lib/tema-betik";
import { DilSaglayici } from "@/components/DilSaglayici";
import { DIL_COOKIE, dilOku } from "@/lib/dil";
import { cookies } from "next/headers";import { prisma } from "@/lib/prisma";
import { sahipMi } from "@/lib/visits";
import "./globals.css";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const headingFont = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zihnora.com.tr"),
  title: "Vardiya — Kafe & Restoran için Vardiya Yönetimi",
  description:
    "Haftalık vardiya planını tek ekranda hazırla, personele WhatsApp mesajını gönder. Türkçe, mevzuat uyarılarıyla, cebinde.",
  applicationName: "Vardiya",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Vardiya",
    title: "Vardiya — Kafe & Restoran için Vardiya Yönetimi",
    description:
      "Haftalık vardiya planını tek ekranda hazırla, ekibine WhatsApp'tan gönder. Ücretsiz, reklamsız, Türkiye'de barındırılıyor.",
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Vardiya — haftalık vardiya planı, tek ekranda.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vardiya — Kafe & Restoran için Vardiya Yönetimi",
    description: "Haftalık vardiya planı, WhatsApp gönderimi ve mevzuat uyarıları. Ücretsiz.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/icons/icon-32.png",
    apple: "/icons/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Vardiya",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

/**
 * Google Tag Manager kapsayıcısı.
 * Kapsayıcı kimliği değişirse yalnız bu sabiti güncelle.
 */
const GTM_ID = "GTM-5V2CMGFF";

/**
 * GTM'in resmî yükleyicisi.
 * `dataLayer` dizisini kurar, `gtm.start` olayını atar ve `gtm.js` betiğini
 * async olarak indirir. `gtm.js` yüklendiğinde kapsayıcıdaki etiketler
 * (GA4, Ads dönüşümü, piksel vb.) devreye girer.
 */
const GTM_BETIGI = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Sağ üst menü ve alt menü oturuma göre değişir (giriş yapılmış / yapılmamış).
  const kullanici = await aktifKullanici();
  // CSP nonce'u middleware üretir; satır içi betiklerin çalışması için gerekli.
  const basliklar = await headers();
  const nonce = basliklar.get("x-nonce") ?? undefined;
  // Arayüz dili çerezden (sunucu ilk boyamada doğru dili çizsin).
  const cerezler = await cookies();
  const dil = dilOku(cerezler.get(DIL_COOKIE)?.value);
  // Giriş sonrası uygulama sayfalarında pazarlama kabuğu yerine uygulama kabuğu.
  const yol = basliklar.get("x-yol") ?? "";
  const uygulamaYolu =
    Boolean(kullanici) &&
    !yol.startsWith("/ekip/") &&
    ["/panel", "/bugun", "/raporlar", "/takvim", "/gecmis", "/sql", "/yazdir", "/profil", "/mesajlar", "/ekip", "/ayarlar"].some(
      (p) => yol === p || yol.startsWith(`${p}/`),
    );

  const isletme = kullanici
    ? await prisma.business.findUnique({
        where: { userId: kullanici.id },
        select: { name: true },
      })
    : null;
  const yil = new Date().getFullYear();

  return (
    <html
      lang={dil}
      suppressHydrationWarning
      className={`${bodyFont.variable} ${headingFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Google Tag Manager — kapsayıcı betiği (head'in en üstünde olmalı) */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: GTM_BETIGI }} />
        {/* End Google Tag Manager */}
      </head>
      <body
        className={`flex min-h-full flex-col ${
          kullanici && !uygulamaYolu ? "pb-16 sm:pb-0" : ""
        }`}
      >
        <DilSaglayici dil={dil}>
        {/* Google Tag Manager (noscript) — JS kapalıysa devreye girer */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        {/* Tema tercihini ilk boyamadan önce uygula (flicker önleyici) */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: TEMA_BETIGI }} />

        <a
          href="#icerik"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          İçeriğe geç
        </a>

        {uygulamaYolu && kullanici ? (
          <UygulamaKabuk
            kullanici={{ email: kullanici.email, username: kullanici.username }}
            isletme={isletme?.name ?? "İşletmem"}
            sahip={sahipMi(kullanici.email)}
          >
            {children}
          </UygulamaKabuk>
        ) : (
          <>
        <header className="site-header sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur print:hidden">
          <div className="kap flex h-14 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-6">
              <Link
                href="/"
                className="marka flex shrink-0 items-center gap-2"
                aria-label="Vardiya — ana sayfa"
              >
                {/* Üst çubuktaki küçük logo bilinçli olarak **durgun**: görüntü
                    aynı, ama dönmez/nefes almaz ve fareyi takip etmez. */}
                <LogoV boyut={32} sinif="logo-kucuk" durgun />
                <span className="text-[15px] tracking-tight">Vardiya</span>
                <span
                  aria-hidden="true"
                  className="h-[5px] w-[5px] rounded-full bg-[#f59e0b]"
                />
              </Link>
              {kullanici ? <UstMenu /> : null}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Site bağlantıları: "Ücretsiz başla"nın hemen solunda, tek tek */}
              {kullanici ? null : (
                <>
                  <SiteMenusu />
                  <span className="mx-1 hidden h-5 w-px bg-zinc-200 md:block" aria-hidden />
                </>
              )}
              <ThemeToggle />
              {kullanici ? (
                <>
                  {/* Sağ üst: görünen ad (e-posta değil) + altında marka adı */}
                  <div className="mr-1 hidden text-right leading-tight sm:block">
                    <p className="max-w-[150px] truncate text-[12.5px] font-semibold text-zinc-800 dark:text-zinc-100">
                      @{kullanici.username ?? kullanici.email.split("@")[0]}
                    </p>
                    <p className="max-w-[150px] truncate text-[11px] text-zinc-500">
                      {isletme?.name ?? "İşletmem"}
                    </p>
                  </div>
                  <ProfilMenusu email={kullanici.email} sahip={sahipMi(kullanici.email)} />
                  {/* Giriş yapıldığında sağ üstte görünür çıkış düğmesi.
                      (Avatar menüsünün içinde de var; burada tek tıkla erişim.) */}
                  <form action="/api/auth/logout" method="post" className="hidden shrink-0 lg:block">
                    <button
                      type="submit"
                      className="btn-sessiz px-3"
                      title="Oturumu kapat"
                      aria-label="Çıkış yap"
                    >
                      Çıkış Yap
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link href="/giris" className="btn-sessiz hidden sm:inline-flex">
                    Giriş
                  </Link>
                  <Link href="/kayit" className="btn-birincil">
                    Ücretsiz başla
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <div id="icerik" className="flex flex-1 flex-col">
          {children}
        </div>

        <footer className="site-footer mt-auto border-t border-zinc-200 bg-white print:hidden">
          <div className="kap flex flex-col gap-4 py-6 text-[12.5px] md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="alt-marka text-zinc-700">
                <Marka boyut={16} yazi />
              </span>
              <span className="alt-soluk text-zinc-400">
                Zihnora&apos;nın ürünü · zihnora.com.tr
              </span>
            </div>

            <nav
              aria-label="Alt menü"
              className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-zinc-500"
            >
              <Link href="/hakkimizda" className="hover:text-zinc-900">
                Hakkımızda
              </Link>
              <Link href="/yardim" className="hover:text-zinc-900">
                Yardım
              </Link>
              <Link href="/gizlilik" className="hover:text-zinc-900">
                Gizlilik
              </Link>
              <Link href="/iletisim" className="hover:text-zinc-900">
                İletişim
              </Link>
            </nav>

            <div className="alt-soluk flex flex-wrap items-center gap-x-3 gap-y-1.5 text-zinc-400">
              <a
                href="mailto:destek@zihnora.com.tr"
                className="underline underline-offset-2 hover:text-zinc-700"
              >
                destek@zihnora.com.tr
              </a>
              <span aria-hidden className="hidden text-zinc-300 sm:inline">
                ·
              </span>
              <span>© {yil}</span>
            </div>
          </div>
        </footer>

        {kullanici ? <AltMenu /> : null}
          </>
        )}
        </DilSaglayici>
      </body>
    </html>
  );
}
