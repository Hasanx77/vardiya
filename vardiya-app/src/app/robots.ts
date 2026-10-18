import type { MetadataRoute } from "next";

/**
 * Panel arama motorlarına kapalı. /giris zaten şifreli,
 * ama botların /panel bağlantısını toplamasını da istemiyoruz.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
