import { describe, expect, it } from "vitest";
import {
  adimNo,
  base32Coz,
  base32Kodla,
  kodDogrula,
  kodUret,
  otpauthAdresi,
  sirUret,
} from "./totp";

/** RFC 6238 test sırrı: "12345678901234567890" (ASCII). */
const RFC_SIR = base32Kodla(Buffer.from("12345678901234567890", "ascii"));

describe("totp", () => {
  it("Base32 gidiş-dönüş bozulmadan çalışır", () => {
    const veri = Buffer.from("Vardiya 2026 — gizli", "utf8");
    expect(base32Coz(base32Kodla(veri)).equals(veri)).toBe(true);
  });

  it("sirUret 32 karakterlik Base32 üretir", () => {
    const sir = sirUret();
    expect(sir).toHaveLength(32);
    expect(sir).toMatch(/^[A-Z2-7]+$/);
    expect(sirUret()).not.toBe(sir);
  });

  it("RFC 6238 vektörleriyle 8 haneli kodlar eşleşir", () => {
    // Kritik değerler: T=59, 1111111109, 1111111111, 1234567890, 2000000000
    const ornekler: [number, string][] = [
      [59, "94287082"],
      [1111111109, "07081804"],
      [1111111111, "14050471"],
      [1234567890, "89005924"],
      [2000000000, "69279037"],
    ];
    for (const [saniye, beklenen] of ornekler) {
      expect(kodUret(RFC_SIR, adimNo(saniye * 1000), 8)).toBe(beklenen);
    }
  });

  it("6 haneli kod her zaman 6 hane", () => {
    const kod = kodUret(sirUret(), adimNo());
    expect(kod).toHaveLength(6);
    expect(kod).toMatch(/^\d{6}$/);
  });

  it("doğru kodu kabul eder, yanlış kodu reddeder", () => {
    const sir = sirUret();
    const kod = kodUret(sir, adimNo());
    expect(kodDogrula(sir, kod)).not.toBeNull();
    const yanlis = kod === "000000" ? "111111" : "000000";
    expect(kodDogrula(sir, yanlis)).toBeNull();
  });

  it("saat kaymasına ±1 adım tolerans tanır", () => {
    const sir = sirUret();
    const simdi = adimNo();
    const onceki = kodUret(sir, simdi - 1);
    const sonraki = kodUret(sir, simdi + 1);
    expect(kodDogrula(sir, onceki)).not.toBeNull();
    expect(kodDogrula(sir, sonraki)).not.toBeNull();

    const ikiOnce = kodUret(sir, simdi - 2);
    expect(kodDogrula(sir, ikiOnce)).toBeNull();
  });

  it("kullanılmış adımı (replay) reddeder", () => {
    const sir = sirUret();
    const adim = adimNo();
    const kod = kodUret(sir, adim);
    expect(kodDogrula(sir, kod, { sonAdim: adim })).toBeNull();
    expect(kodDogrula(sir, kod, { sonAdim: adim - 1 })).not.toBeNull();
  });

  it("boşluklu/formatlı kod da kabul edilir", () => {
    const sir = sirUret();
    const kod = kodUret(sir, adimNo());
    const bicimli = `${kod.slice(0, 3)} ${kod.slice(3)}`;
    expect(kodDogrula(sir, bicimli)).not.toBeNull();
  });

  it("otpauth adresi doğru parametreleri taşır", () => {
    const adres = otpauthAdresi("a@b.com", "ABC234");
    expect(adres.startsWith("otpauth://totp/Vardiya%3Aa%40b.com?")).toBe(true);
    expect(adres).toContain("secret=ABC234");
    expect(adres).toContain("period=30");
    expect(adres).toContain("digits=6");
  });
});
