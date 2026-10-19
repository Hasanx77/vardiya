import { describe, it, expect } from "vitest";
import {
  addDays,
  formatShort,
  formatWeekRange,
  getWeekDates,
  startOfWeek,
  toISODate,
} from "./dates";

describe("toISODate", () => {
  it("yerel tarihi YYYY-MM-DD yapar", () => {
    expect(toISODate(new Date(2026, 9, 8))).toBe("2026-10-08");
  });
  it("tek haneli ay/günü sıfırla doldurur", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("startOfWeek (hafta pazartesi başlar)", () => {
  it("çarşamba için pazartesiyi verir", () => {
    const wed = new Date(2026, 9, 7); // 7 Ekim 2026 Çarşamba
    const mon = startOfWeek(wed);
    expect(toISODate(mon)).toBe("2026-10-05");
    expect(mon.getDay()).toBe(1); // Pazartesi
  });
  it("pazar günü için önceki pazartesiyi verir", () => {
    const sun = new Date(2026, 9, 11); // Pazar
    expect(toISODate(startOfWeek(sun))).toBe("2026-10-05");
  });
});

describe("getWeekDates", () => {
  it("7 gün döndürür", () => {
    expect(getWeekDates(0)).toHaveLength(7);
  });
  it("günler üst üste artar", () => {
    const w = getWeekDates(0);
    for (let i = 1; i < 7; i++) {
      expect(toISODate(w[i])).toBe(toISODate(addDays(w[0], i)));
    }
  });
  it("gelecek hafta 7 gün ileri gider", () => {
    const thisWeek = getWeekDates(0);
    const nextWeek = getWeekDates(1);
    expect(toISODate(nextWeek[0])).toBe(toISODate(addDays(thisWeek[0], 7)));
  });
});

describe("formatShort", () => {
  it("gün ve kısa ay döner", () => {
    expect(formatShort(new Date(2026, 9, 8))).toBe("8 Eki");
  });
});

describe("formatWeekRange", () => {
  it("aynı ay içindeki haftayı kısa yazar", () => {
    const gunler = Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 5 + i));
    expect(formatWeekRange(gunler)).toBe("5 – 11 Eki 2026");
  });

  it("ay sınırını geçen haftada sol tarafın ayını da yazar", () => {
    const gunler = Array.from({ length: 7 }, (_, i) => new Date(2026, 8, 29 + i));
    expect(formatWeekRange(gunler)).toBe("29 Eyl – 5 Eki 2026");
  });

  it("yıl sınırını geçen haftada iki yılı da yazar", () => {
    const gunler = Array.from({ length: 7 }, (_, i) => new Date(2025, 11, 29 + i));
    expect(formatWeekRange(gunler)).toBe("29 Ara 2025 – 4 Oca 2026");
  });
});
