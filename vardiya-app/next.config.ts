import type { NextConfig } from "next";

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
};

export default nextConfig;
