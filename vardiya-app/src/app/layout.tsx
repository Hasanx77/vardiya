import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import ProfilMenusu from "@/components/ProfilMenusu";
import { AltMenu, UstMenu } from "@/components/Menu";
import SiteMenusu from "@/components/SiteMenusu";
import Animasyon from "@/components/Animasyon";
import Ilerleme from "@/components/Ilerleme";
import KaydirmaDurumu from "@/components/KaydirmaDurumu";
import { aktifKullanici } from "@/lib/auth";
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
    "5 dakikada haftalık vardiya planla, personele WhatsApp mesajını hazırla. Türkçe, mevzuat uyarılarıyla, cebinde.",
  applicationName: "Vardiya",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Vardiya",
    title: "Vardiya — Kafe & Restoran için Vardiya Yönetimi",
    description:
      "Haftalık vardiya planını 5 dakikada hazırla, ekibine WhatsApp'tan gönder. Ücretsiz, reklamsız, Türkiye'de barındırılıyor.",
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Vardiya — haftalık vardiya planı, 5 dakikada hazır.",
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
    { media: "(prefers-color-scheme: dark)", color: "#0b0f11" },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Sağ üst menü ve alt menü oturuma göre değişir (giriş yapılmış / yapılmamış).
  const kullanici = await aktifKullanici();
  const yil = new Date().getFullYear();

  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${headingFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className={`flex min-h-full flex-col ${
          kullanici ? "pb-16 sm:pb-0" : ""
        }`}
      >
        {/* Tema tercihini ilk boyamadan önce uygula (flicker önleyici) */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('vardiya-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}",
          }}
        />

        <Ilerleme />
        <KaydirmaDurumu />
        <Animasyon />
        <noscript>
          <style>{`[data-reveal]{transform:none!important}`}</style>
        </noscript>

        <a
          href="#icerik"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          İçeriğe geç
        </a>

        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur print:hidden">
          <div className="kap flex h-14 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-6">
              <Link href="/" className="marka flex shrink-0 items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500 text-[13px] font-bold text-zinc-950">
                  V
                </span>
                <span className="tracking-tight">Vardiya</span>
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
                  <ProfilMenusu email={kullanici.email} sahip={sahipMi(kullanici.email)} />
                  {/* Giriş yapıldığında sağ üstte görünür çıkış düğmesi.
                      (Avatar menüsünün içinde de var; burada tek tıkla erişim.) */}
                  <form action="/api/auth/logout" method="post" className="shrink-0">
                    <button
                      type="submit"
                      className="btn-sessiz px-3"
                      title="Oturumu kapat"
                      aria-label="Çıkış yap"
                    >
                      <span className="sm:hidden">Çıkış</span>
                      <span className="hidden sm:inline">Çıkış Yap</span>
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

        <footer className="mt-auto border-t border-zinc-200 bg-white print:hidden">
          <div className="kap flex flex-col gap-3 py-5 text-[13px] text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Vardiya, Zihnora&apos;nın ürünüdür · Yayın adresi: zihnora.com.tr
              <span className="mt-1 block text-[11px] text-zinc-400">
                İleride vardiya.app adresine taşınacak; bu adres de çalışmaya devam
                edecek. Destek:{" "}
                <a
                  href="mailto:destek@zihnora.com.tr"
                  className="underline underline-offset-2 hover:text-zinc-700"
                >
                  destek@zihnora.com.tr
                </a>
              </span>
            </span>
            {/* Menü bağlantıları üst çubukta; altbilgide yalnızca telif. */}
            <span className="text-zinc-400">© {yil}</span>
          </div>
        </footer>

        {kullanici ? <AltMenu /> : null}
      </body>
    </html>
  );
}
