import { describe, it, expect } from "vitest";
import { DEFAULT_SHIFTS, WEEKLY_LIMIT_HOURS, shiftHours } from "./shifts";

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
