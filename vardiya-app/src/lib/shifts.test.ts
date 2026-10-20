import { describe, it, expect } from "vitest";
import {
  DEFAULT_SHIFTS,
  WEEKLY_LIMIT_HOURS,
  araGecerliMi,
  shiftHours,
  shiftSaatMetni,
  standartSablonlar,
} from "./shifts";

describe("shiftHours", () => {
  it("gündüz vardiyası 8 saat", () => {
    expect(shiftHours({ start: "09:00", end: "17:00" })).toBe(8);
  });
  it("gece yarısını aşan vardiya", () => {
    expect(shiftHours({ start: "17:00", end: "01:00" })).toBe(8);
  });
  it("tam gün 12 saat", () => {
    expect(shiftHours({ start: "10:00", end: "22:00" })).toBe(12);
  });
  it("gece vardiyası 20:00-08:00 = 12 saat", () => {
    expect(shiftHours({ start: "20:00", end: "08:00" })).toBe(12);
  });
  it("buçuklu saatler", () => {
    expect(shiftHours({ start: "09:30", end: "18:00" })).toBe(8.5);
  });
  it("başlangıç = bitiş ise 0 saat (24 saat değil)", () => {
    expect(shiftHours({ start: "09:00", end: "09:00" })).toBe(0);
  });
  it("bölünmüş vardiyada ücretsiz ara düşülür", () => {
    expect(
      shiftHours({ start: "09:00", end: "22:00", breakStart: "13:00", breakEnd: "17:00" })
    ).toBe(9);
  });
  it("ara vardiya dışındaysa süre yanlış hesaplanmaz", () => {
    expect(
      shiftHours({ start: "09:00", end: "17:00", breakStart: "18:00", breakEnd: "19:00" })
    ).toBe(8);
  });
});

describe("araGecerliMi", () => {
  it("vardiya içindeki ara geçerli", () => {
    expect(araGecerliMi("09:00", "22:00", "13:00", "17:00")).toBe(true);
  });
  it("vardiya dışına taşan ara geçersiz", () => {
    expect(araGecerliMi("09:00", "17:00", "16:00", "18:00")).toBe(false);
  });
  it("ters ara geçersiz", () => {
    expect(araGecerliMi("09:00", "22:00", "17:00", "13:00")).toBe(false);
  });
});

describe("shiftSaatMetni", () => {
  it("arayı okunur biçimde gösterir", () => {
    expect(
      shiftSaatMetni({ start: "09:00", end: "22:00", breakStart: "13:00", breakEnd: "17:00" })
    ).toBe("09:00–22:00 (ara 13:00–17:00)");
  });
});

describe("standartSablonlar", () => {
  it("kısa mesai saatlerinde ara vardiya ters dönmez", () => {
    const sablonlar = standartSablonlar("09:00", "11:00");
    for (const s of sablonlar) {
      expect(shiftHours(s)).toBeGreaterThan(0);
      expect(shiftHours(s)).toBeLessThanOrEqual(24);
    }
    const ara = sablonlar.find((s) => s.name === "Ara Vardiya")!;
    expect(ara.start).toBe("09:30");
    expect(ara.end).toBe("10:30");
  });
  it("normal mesai saatlerinde beklenen şablonlar", () => {
    const sablonlar = standartSablonlar("09:00", "23:00");
    expect(sablonlar.map((s) => s.name)).toEqual([
      "Sabah",
      "Akşam",
      "Tam Gün",
      "Ara Vardiya",
    ]);
    expect(sablonlar[0]).toMatchObject({ start: "09:00", end: "16:00" });
    expect(sablonlar[2]).toMatchObject({ start: "09:00", end: "23:00" });
  });
});

describe("sabitler", () => {
  it("haftalık yasal sınır 45 saat", () => {
    expect(WEEKLY_LIMIT_HOURS).toBe(45);
  });
  it("varsayılan şablonlar tanımlı", () => {
    expect(DEFAULT_SHIFTS.length).toBeGreaterThan(0);
    DEFAULT_SHIFTS.forEach((s) => {
      expect(s.name).toBeTruthy();
      expect(shiftHours(s)).toBeGreaterThan(0);
    });
  });
});
