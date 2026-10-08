import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vardiya — Kafe & Restoran için Vardiya Yönetimi",
  description:
    "5 dakikada haftalık vardiya planla, personele WhatsApp'tan tek tıkla gönder. Türkçe, mevzuata uygun, cebinde.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <header className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-30">
          <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-zinc-900 text-white text-sm">
                V
              </span>
              <span className="tracking-tight">Vardiya</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/"
                className="rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              >
                Ana Sayfa
              </Link>
              <Link
                href="/panel"
                className="rounded-md px-3 py-1.5 font-medium bg-zinc-900 text-white hover:bg-zinc-700"
              >
                Panele Git
              </Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mt-auto border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-zinc-500 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>Vardiya — kafe & restoranlar için vardiya yönetimi.</span>
            <span>MVP · yerel veri (tarayıcı depolaması)</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
