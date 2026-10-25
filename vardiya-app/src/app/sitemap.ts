import type { MetadataRoute } from "next";

const TABAN = "https://zihnora.com.tr";

/** Her istekte üretilir (eski ön-render önbelleği servis edilmesin). */
export const dynamic = "force-dynamic";

/**
 * Yalnızca herkese açık sayfalar dizine eklenir; panel ve hesap sayfaları kapalı.
 *
 * `lastModified` sabit: her istekte "şimdi" yazmak, arama motorlarına sayfanın
 * sürekli değiştiğini söyler (tarama bütçesini boşa harcar). İçerik değişince
 * bu tarihi elle güncelleyin.
 */
const SON_GUNCELLEME = new Date("2026-10-25T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const son = SON_GUNCELLEME;
  return [
    { url: `${TABAN}/`, lastModified: son, changeFrequency: "weekly", priority: 1 },
    { url: `${TABAN}/demo`, lastModified: son, changeFrequency: "weekly", priority: 0.9 },
    { url: `${TABAN}/hakkimizda`, lastModified: son, changeFrequency: "monthly", priority: 0.7 },
    { url: `${TABAN}/yardim`, lastModified: son, changeFrequency: "monthly", priority: 0.6 },
    { url: `${TABAN}/iletisim`, lastModified: son, changeFrequency: "monthly", priority: 0.6 },
    { url: `${TABAN}/gizlilik`, lastModified: son, changeFrequency: "yearly", priority: 0.3 },
    { url: `${TABAN}/personel-aydinlatma`, lastModified: son, changeFrequency: "yearly", priority: 0.3 },
  ];
}
