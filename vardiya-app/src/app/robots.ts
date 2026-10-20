import type { MetadataRoute } from "next";

/**
 * Her istekte üretilir: yayın sonrası eski ön-render önbelleği
 * (robots.txt.body) servis edilmesin.
 */
export const dynamic = "force-dynamic";

/**
 * Tanıtım sayfaları aranabilir; uygulama ve hesap sayfaları kapalı.
 * (Panel zaten oturum ister, ama botların bağlantı toplamasını da istemiyoruz.)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/demo", "/hakkimizda", "/yardim", "/gizlilik", "/iletisim"],
        disallow: [
          "/panel",
          "/bugun",
          "/raporlar",
          "/takvim",
          "/ekip",
          "/yazdir",
          "/profil",
          "/basla",
          "/mesajlar",
          "/giris",
          "/kayit",
          "/api/",
        ],
      },
    ],
    sitemap: "https://zihnora.com.tr/sitemap.xml",
  };
}
