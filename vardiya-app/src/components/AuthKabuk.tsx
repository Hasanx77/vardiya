"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Marka from "@/components/Marka";
import LogoV from "@/components/LogoV";
import { useDil } from "@/components/DilSaglayici";

/**
 * Giriş / kayıt sayfalarının ortak kabuğu.
 *
 * Tasarım kararı: bu iki sayfa **kendi koyu kabuğunda** yaşar. Üst menü ve
 * site altbilgisi gizlenir (dikkat dağıtan kaçış yolları yok); yalnızca
 * "Ana sayfa" bağlantısı kalır. Solda marka + karşılama, sağda form kartı.
 * Mobilde karşılama kısalır, form öne geçer.
 */
export default function AuthKabuk({
  baslik,
  alt,
  karsilama = "Tekrar hoş geldin.",
  karsilamaAlt = "Haftalık planın, ekibin ve raporların seni bekliyor.",
  children,
}: {
  baslik: string;
  alt: string;
  karsilama?: string;
  karsilamaAlt?: string;
  children: ReactNode;
}) {
  const { t } = useDil();
  return (
    <main className="giris-sayfa flex-1">
      <div className="auth-kap">
        {/* Üst şerit: marka + eve dönüş */}
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="marka inline-flex items-center gap-2 text-[#ededf0]"
            aria-label="Vardiya — ana sayfa"
          >
            <Marka boyut={22} yazi nokta />
          </Link>
          <Link
            href="/"
            className="auth-ust-baglanti"
          >
            {t("auth.home")} <span aria-hidden>↗</span>
          </Link>
        </header>

        <div className="auth-grid">
          {/* Karşılama */}
          <section className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <LogoV
                boyut="clamp(96px, 17vw, 188px)"
                etiket="Vardiya logosu: ışığı yansıtan üç boyutlu V"
              />
            </div>

            <h1 className="auth-karsilama">{karsilama}</h1>
            <p className="auth-karsilama-alt">{karsilamaAlt}</p>

            <ul className="auth-liste">
              <li>{t("auth.benefit1")}</li>
              <li>{t("auth.benefit2")}</li>
              <li>{t("auth.benefit3")}</li>
              <li>{t("auth.benefit4")}</li>
            </ul>

            <p className="auth-alt-not">{t("auth.noCard")}</p>
          </section>

          {/* Form */}
          <section className="w-full">
            <div className="auth-kart">
              <h2 className="auth-form-baslik">{baslik}</h2>
              <p className="auth-form-alt">{alt}</p>
              {children}
            </div>

            <p className="auth-guven">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden
              >
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              {t("auth.secure")}
            </p>
          </section>
        </div>

        <footer className="auth-altbilgi">
          <span>© {new Date().getFullYear()} {t("auth.footer")}</span>
          <span className="flex gap-4">
            <Link href="/gizlilik">{t("auth.privacy")}</Link>
            <a href="mailto:destek@zihnora.com.tr">{t("auth.destek")}</a>
          </span>
        </footer>
      </div>
    </main>
  );
}
