import type { NextConfig } from "next";

/**
 * Güvenlik başlıkları.
 *
 * CSP'de `'unsafe-inline'` var: Next hidrasyon betiği ve tema tercihi için
 * sayfaya gömülü küçük bir betik kullanıyor. Dış kaynak (CDN, reklam, üçüncü
 * taraf analitik) YOK; bu yüzden geri kalan her şey `'self'` ile sınırlı.
 */
const icerikGuvenligi = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
].join("; ");

const nextConfig: NextConfig = {
  // Uygulama kökü açıkça belirtilir; üst dizindeki fazladan lockfile'lar
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
          { key: "Content-Security-Policy", value: icerikGuvenligi },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          { key: "Strict-Transport-Security", value: "max-age=15552000" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
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
