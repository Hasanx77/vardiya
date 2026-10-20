import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import ProfilMenusu from "@/components/ProfilMenusu";
import { AltMenu, UstMenu } from "@/components/Menu";
import Animasyon from "@/components/Animasyon";
import Ilerleme from "@/components/Ilerleme";
import KaydirmaDurumu from "@/components/KaydirmaDurumu";
import { aktifKullanici } from "@/lib/auth";
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
    "5 dakikada haftalık vardiya planla, personele WhatsApp'tan tek tıkla gönder. Türkçe, mevzuata uygun, cebinde.",
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
              <ThemeToggle />
              {kullanici ? (
                <ProfilMenusu email={kullanici.email} />
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link href="/giris" className="btn-sessiz">
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
          <div className="kap flex flex-col gap-2 py-5 text-[13px] text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Vardiya — kafe &amp; restoranlar için vardiya yönetimi.
            </span>
            <span className="flex items-center gap-4">
              <Link href="/hakkimizda" className="hover:text-zinc-900 hover:underline">
                Hakkımızda
              </Link>
              <Link href="/yardim" className="hover:text-zinc-900 hover:underline">
                Yardım
              </Link>
              <Link href="/gizlilik" className="hover:text-zinc-900 hover:underline">
                Gizlilik
              </Link>
              <span className="text-zinc-400">© {yil}</span>
            </span>
          </div>
        </footer>

        {kullanici ? <AltMenu /> : null}
      </body>
    </html>
  );
}
