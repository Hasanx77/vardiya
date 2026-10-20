import { describe, it, expect } from "vitest";
import { isValidISODate, normalizeTime, sinirliTamSayi } from "./validate";
import { guvenliHedef } from "./url";

describe("normalizeTime", () => {
  it("tek haneli saati düzeltir", () => {
    expect(normalizeTime("9:05")).toBe("09:05");
  });
  it("geçersiz değerde boş metin döner", () => {
    expect(normalizeTime("")).toBe("");
    expect(normalizeTime("24:00")).toBe("");
    expect(normalizeTime("abc")).toBe("");
  });
});

describe("isValidISODate", () => {
  it("geçerli tarihleri kabul eder", () => {
    expect(isValidISODate("2026-10-20")).toBe(true);
    expect(isValidISODate("2024-02-29")).toBe(true);
  });
  it("olmayan takvim günlerini reddeder", () => {
    expect(isValidISODate("2026-02-31")).toBe(false);
    expect(isValidISODate("2026-13-01")).toBe(false);
    expect(isValidISODate("20-10-2026")).toBe(false);
    expect(isValidISODate("")).toBe(false);
  });
});

describe("sinirliTamSayi", () => {
  it("aralığa sıkıştırır", () => {
    expect(sinirliTamSayi(999, 0, 365, 14)).toBe(365);
    expect(sinirliTamSayi(-5, 0, 365, 14)).toBe(0);
    expect(sinirliTamSayi("12", 0, 365, 14)).toBe(12);
  });
  it("geçersizde varsayılanı döner", () => {
    expect(sinirliTamSayi("abc", 0, 365, 14)).toBe(14);
  });
});

describe("guvenliHedef", () => {
  it("site içi yolları kabul eder", () => {
    expect(guvenliHedef("/panel")).toBe("/panel");
    expect(guvenliHedef("/raporlar?ay=2026-10")).toBe("/raporlar?ay=2026-10");
  });
  it("dış adresleri ve kaçış denemelerini reddeder", () => {
    expect(guvenliHedef("//evil.com")).toBe("/panel");
    expect(guvenliHedef("/\\evil.com")).toBe("/panel");
    expect(guvenliHedef("https://evil.com")).toBe("/panel");
    expect(guvenliHedef("")).toBe("/panel");
  });
});
