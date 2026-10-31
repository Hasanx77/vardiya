import { describe, expect, it } from "vitest";
import {
  okunduCumlesi,
  okunduHedefiGecerliMi,
  okunduOzeti,
  okunduTuruGecerliMi,
} from "./okundu";

describe("okundu — tür ve hedef doğrulama", () => {
  it("yalnızca plan ve duyuru türlerini kabul eder", () => {
    expect(okunduTuruGecerliMi("plan")).toBe(true);
    expect(okunduTuruGecerliMi("duyuru")).toBe(true);
    expect(okunduTuruGecerliMi("izin")).toBe(false);
    expect(okunduTuruGecerliMi("")).toBe(false);
    expect(okunduTuruGecerliMi(null)).toBe(false);
    expect(okunduTuruGecerliMi(42)).toBe(false);
  });

  it("plan hedefi takvim günü (YYYY-MM-DD) olmalı", () => {
    expect(okunduHedefiGecerliMi("plan", "2026-10-26")).toBe(true);
    expect(okunduHedefiGecerliMi("plan", "26-10-2026")).toBe(false);
    expect(okunduHedefiGecerliMi("plan", "2026-10-26 OR 1=1")).toBe(false);
    expect(okunduHedefiGecerliMi("plan", "")).toBe(false);
  });

  it("duyuru hedefi güvenli kimlik olmalı", () => {
    expect(okunduHedefiGecerliMi("duyuru", "clx123abc")).toBe(true);
    expect(okunduHedefiGecerliMi("duyuru", "a".repeat(64))).toBe(true);
    expect(okunduHedefiGecerliMi("duyuru", "a".repeat(65))).toBe(false);
    expect(okunduHedefiGecerliMi("duyuru", "abc def")).toBe(false);
    expect(okunduHedefiGecerliMi("duyuru", "")).toBe(false);
  });
});

describe("okunduOzeti", () => {
  it("görenleri sayar, görmeyenleri listeler", () => {
    const ozet = okunduOzeti(["a", "b", "c"], ["a", "c"]);

    expect(ozet.toplam).toBe(3);
    expect(ozet.goren).toBe(2);
    expect(ozet.gormeyen).toEqual(["b"]);
    expect(ozet.oran).toBe(67);
    expect(ozet.tam).toBe(false);
  });

  it("işletmeye ait olmayan kimlikleri saymaz (3/2 gibi oran çıkmaz)", () => {
    const ozet = okunduOzeti(["a"], ["a", "baska-hesap"]);

    expect(ozet.goren).toBe(1);
    expect(ozet.toplam).toBe(1);
    expect(ozet.tam).toBe(true);
    expect(ozet.oran).toBe(100);
  });

  it("aynı kimlik iki kez gelse de bir kez sayar", () => {
    const ozet = okunduOzeti(["a", "b"], ["a", "a", "a"]);

    expect(ozet.goren).toBe(1);
    expect(ozet.gormeyen).toEqual(["b"]);
  });

  it("personel yoksa tam=false, oran=0", () => {
    const ozet = okunduOzeti([], []);

    expect(ozet.toplam).toBe(0);
    expect(ozet.goren).toBe(0);
    expect(ozet.oran).toBe(0);
    expect(ozet.tam).toBe(false);
  });
});

describe("okunduCumlesi", () => {
  it("duruma göre tek satır özet verir", () => {
    expect(okunduCumlesi(okunduOzeti([], []))).toBe("Henüz personel yok");
    expect(okunduCumlesi(okunduOzeti(["a", "b"], []))).toBe(
      "Henüz kimse görmedi (0/2)",
    );
    expect(okunduCumlesi(okunduOzeti(["a", "b"], ["a"]))).toBe("1/2 kişi gördü");
    expect(okunduCumlesi(okunduOzeti(["a", "b"], ["a", "b"]))).toBe(
      "Herkes gördü (2/2)",
    );
  });
});
