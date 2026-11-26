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
        allow: ["/", "/demo", "/hakkimizda", "/yardim", "/gizlilik", "/personel-aydinlatma", "/iletisim"],
        disallow: [
          "/panel",
          "/bugun",
          "/raporlar",
          "/takvim",
          "/gecmis",
          "/sql",
          "/ayarlar",
          "/ekip",
          "/yazdir",
          "/profil",
          "/basla",
          "/mesajlar",
          "/giris",
          "/kayit",
          "/kodla-giris",
          "/sifre-sifirla",
          "/eposta-dogrula",
          "/api/",
        ],
      },
    ],
    sitemap: "https://zihnora.com.tr/sitemap.xml",
  };
}
