import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ASGARI_ANAHTAR_UZUNLUGU,
  ANAHTAR_HATASI,
  authSecret,
  authSecretVarMi,
} from "./sir";

/**
 * Y-6 regresyon testi — sabit yedek anahtarlar kaldırıldı.
 *
 * Kural: `AUTH_SECRET` yoksa veya çok kısaysa uygulama **sessizce zayıf bir
 * anahtara düşmez**. Oturum çerezleri ve personel bağlantıları imzalanamıyorsa
 * açık hata verilir (fail-closed).
 */

const KOK = process.cwd();
const kaynak = (goreli: string) => readFileSync(path.join(KOK, goreli), "utf8");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("authSecret", () => {
  it("tanımlı değilse açık hata verir", () => {
    vi.stubEnv("AUTH_SECRET", "");
    expect(() => authSecret()).toThrow(ANAHTAR_HATASI);
  });

  it("32 karakterden kısaysa hata verir", () => {
    vi.stubEnv("AUTH_SECRET", "a".repeat(ASGARI_ANAHTAR_UZUNLUGU - 1));
    expect(() => authSecret()).toThrow(/en az 32 karakter/i);
  });

  it("yeterince uzunsa değeri döner", () => {
    const anahtar = "b".repeat(ASGARI_ANAHTAR_UZUNLUGU);
    vi.stubEnv("AUTH_SECRET", anahtar);
    expect(authSecret()).toBe(anahtar);
  });

  it("baş/son boşlukları temizler", () => {
    const anahtar = "c".repeat(ASGARI_ANAHTAR_UZUNLUGU);
    vi.stubEnv("AUTH_SECRET", `  ${anahtar}\n`);
    expect(authSecret()).toBe(anahtar);
  });
});

describe("authSecretVarMi", () => {
  it("eksikse false", () => {
    vi.stubEnv("AUTH_SECRET", "kisa");
    expect(authSecretVarMi()).toBe(false);
  });

  it("yeterliyse true", () => {
    vi.stubEnv("AUTH_SECRET", "d".repeat(ASGARI_ANAHTAR_UZUNLUGU));
    expect(authSecretVarMi()).toBe(true);
  });
});

describe("sabit yedek anahtar kalmadı (kaynak taraması)", () => {
  const YASAK = [
    "vardiya-gelistirme-baglanti-anahtari",
    "varsayilan-anahtar",
    '"varsayilan"',
    "?? \"varsayilan",
  ];
  const DOSYALAR = ["src/lib/employee-link.ts", "src/lib/iki-adim.ts", "src/lib/visits.ts"];

  it.each(DOSYALAR)("%s sabit anahtar içermiyor", (dosya) => {
    const metin = kaynak(dosya);
    for (const parca of YASAK) {
      expect(metin).not.toContain(parca);
    }
  });

  it("session.ts eşiği 32 karakter", () => {
    const metin = kaynak("src/lib/session.ts");
    expect(metin).toMatch(/authSecretVarMi|authSecret\(/);
    expect(metin).not.toMatch(/ASGARI_ANAHTAR_UZUNLUGU\s*=\s*16/);
  });
});

describe("instrumentation (üretim başlangıç kontrolü)", () => {
  it("üretimde anahtar yoksa süreç başlamaz", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_SECRET", "");
    const { register } = await import("../instrumentation");
    await expect(register()).rejects.toThrow(ANAHTAR_HATASI);
  });

  it("üretimde anahtar varsa geçer", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_SECRET", "e".repeat(ASGARI_ANAHTAR_UZUNLUGU));
    const { register } = await import("../instrumentation");
    await expect(register()).resolves.toBeUndefined();
  });

  it("geliştirmede anahtar aramaz", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_SECRET", "");
    const { register } = await import("../instrumentation");
    await expect(register()).resolves.toBeUndefined();
  });
});
