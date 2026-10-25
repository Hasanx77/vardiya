import type { NextConfig } from "next";

/**
 * Vardiya — Next yapılandırması.
 *
 * Güvenlik başlıkları burada; **CSP artık middleware'de** üretiliyor
 * (`src/middleware.ts`). Sebep: uygulama sayfalarında `nonce` tabanlı sıkı
 * politika kullanıyoruz. Burada da CSP yazsaydık iki başlık kesişir ve
 * `'unsafe-inline'` içeren gevşek taraf kazanırdı.
 */
const nextConfig: NextConfig = {
  // Uygulama küçük ağaçta belirtilir; üst dizindeki fazladan lockfile'lar
  // Next'in yanlış workspace kökü seçmesine neden olmasın.
  turbopack: {
    root: process.cwd(),
  },
  // Paylaşımlı hostingde (CloudLinux LVE) eşzamanlı işlem sayısı sınırlı:
  // Next onlarca işçi süreç başlatınca "spawn EAGAIN" veriyor.
  // Tek işçiye düşürüyoruz (yerelde de zararsız, sadece biraz yavaş).
  experimental: {
    cpus: 1,
  },
  // Sürüm bilgisini dışarı sızdırma.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          // 1 yıl. includeSubDomains/preload bilinçli olarak yok: alt alan adları
          // (posta, cPanel) HTTP kullanıyorsa siteyi erişilemez hale getirebilir.
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
      {
        // İkonlar ve OG görseli nadiren değişir: tarayıcıda uzun süre kalsın.
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/og.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
