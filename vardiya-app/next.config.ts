import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uygulama kökü açıkça belirtilir; üst dizindeki fazladan lockfile'lar
  // Next'in yanlış workspace kökü seçmesine neden olmasın.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
