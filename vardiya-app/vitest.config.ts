import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Vitest yapılandırması.
 *
 * Neden gerekli: testler `@/lib/...` yol takma adını kullanıyor (uygulama
 * koduyla aynı import biçimi). Vitest, TypeScript'in `paths` ayarını kendiliğinden
 * okumaz; alias'ı burada tanımlıyoruz. Böylece API route'ları da (NextResponse
 * dahil) doğrudan test edilebiliyor.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
