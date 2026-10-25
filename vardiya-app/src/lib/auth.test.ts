import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { girdilerGecerliMi, sifreDogruMu, sifreOzetle } from "./auth";

/**
 * Y-5 regresyon testi — şifre özetleme asenkron.
 *
 * `scryptSync` her giriş/kayıtta event loop'u ~50-100 ms bloke ediyordu.
 * Paylaşımlı sunucuda tek CPU (`cpus: 1`) olduğu için 20-30 eşzamanlı giriş
 * isteği tüm siteyi durdurabiliyordu. Artık `scrypt` (callback) promisify
 * edilerek kullanılıyor.
 */

const kaynak = readFileSync(path.join(process.cwd(), "src/lib/auth.ts"), "utf8");

describe("sifreOzetle / sifreDogruMu", () => {
  it("özetleme Promise döner (senkron değil)", () => {
    const sonuc = sifreOzetle("gizli-sifre-1234");
    expect(sonuc).toBeInstanceOf(Promise);
  });

  it("scrypt$tuz$özet biçiminde üretir", async () => {
    const ozet = await sifreOzetle("gizli-sifre-1234");
    expect(ozet).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  });

  it("aynı şifre iki farklı tuz üretir", async () => {
    const a = await sifreOzetle("ayni-sifre");
    const b = await sifreOzetle("ayni-sifre");
    expect(a).not.toBe(b);
  });

  it("doğru şifreyi kabul eder", async () => {
    const ozet = await sifreOzetle("dogru-sifre-123");
    await expect(sifreDogruMu("dogru-sifre-123", ozet)).resolves.toBe(true);
  });

  it("yanlış şifreyi reddeder", async () => {
    const ozet = await sifreOzetle("dogru-sifre-123");
    await expect(sifreDogruMu("yanlis-sifre-123", ozet)).resolves.toBe(false);
  });

  it("bozuk kayıtta false döner", async () => {
    await expect(sifreDogruMu("x", "")).resolves.toBe(false);
    await expect(sifreDogruMu("x", "bcrypt$tuz$ozet")).resolves.toBe(false);
    await expect(sifreDogruMu("x", "scrypt$tuz")).resolves.toBe(false);
  });
});

describe("kaynak taraması", () => {
  it("senkron scrypt kullanılmıyor", () => {
    expect(kaynak).not.toContain("scryptSync");
  });

  it("scrypt promisify edilmiş", () => {
    expect(kaynak).toMatch(/promisify\(scrypt\)/);
  });
});

describe("girdilerGecerliMi (davranış korunuyor)", () => {
  it("kısa şifreyi reddeder", () => {
    expect(girdilerGecerliMi("a@b.com", "1234567")).toMatch(/en az 8/);
  });
  it("geçerli girdiyi kabul eder", () => {
    expect(girdilerGecerliMi("a@b.com", "12345678")).toBeNull();
  });
  it("bozuk e-postayı reddeder", () => {
    expect(girdilerGecerliMi("bozuk", "12345678")).toMatch(/e-posta/);
  });
});
