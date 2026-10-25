import { describe, expect, it } from "vitest";
import { ESIK, beklemeMetni, kilitSuresi } from "./giris-korumasi";

describe("giriş koruması politikası", () => {
  it("eşiğin altında kilit yok", () => {
    for (let i = 0; i < ESIK; i++) expect(kilitSuresi(i)).toBe(0);
  });

  it("eşikten sonra kilit kademeli uzar", () => {
    expect(kilitSuresi(5)).toBe(60_000);
    expect(kilitSuresi(6)).toBe(5 * 60_000);
    expect(kilitSuresi(7)).toBe(15 * 60_000);
    expect(kilitSuresi(8)).toBe(30 * 60_000);
  });

  it("kilit en fazla 1 saat", () => {
    expect(kilitSuresi(9)).toBe(60 * 60_000);
    expect(kilitSuresi(50)).toBe(60 * 60_000);
    expect(kilitSuresi(1_000_000)).toBe(60 * 60_000);
  });

  it("bekleme metni okunur", () => {
    expect(beklemeMetni(0)).toBe("");
    expect(beklemeMetni(45)).toBe("45 saniye");
    expect(beklemeMetni(90)).toBe("2 dakika");
    expect(beklemeMetni(3600)).toBe("1 saat");
    expect(beklemeMetni(7200)).toBe("2 saat");
  });
});
