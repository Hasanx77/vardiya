import type { MetadataRoute } from "next";

const TABAN = "https://zihnora.com.tr";

/** Yalnızca herkese açık sayfalar dizine eklenir; panel ve hesap sayfaları kapalı. */
export default function sitemap(): MetadataRoute.Sitemap {
  const son = new Date();
  return [
    { url: `${TABAN}/`, lastModified: son, changeFrequency: "weekly", priority: 1 },
    { url: `${TABAN}/hakkimizda`, lastModified: son, changeFrequency: "monthly", priority: 0.7 },
    { url: `${TABAN}/yardim`, lastModified: son, changeFrequency: "monthly", priority: 0.6 },
    { url: `${TABAN}/gizlilik`, lastModified: son, changeFrequency: "yearly", priority: 0.3 },
  ];
}
