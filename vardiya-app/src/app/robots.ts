import type { MetadataRoute } from "next";

/**
 * Tanıtım sayfaları aranabilir; uygulama ve hesap sayfaları kapalı.
 * (Panel zaten oturum ister, ama botların bağlantı toplamasını da istemiyoruz.)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/hakkimizda", "/yardim", "/gizlilik"],
        disallow: [
          "/panel",
          "/bugun",
          "/raporlar",
          "/takvim",
          "/ekip",
          "/yazdir",
          "/profil",
          "/basla",
          "/giris",
          "/kayit",
          "/api/",
        ],
      },
    ],
    sitemap: "https://zihnora.com.tr/sitemap.xml",
  };
}
