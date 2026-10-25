import { describe, expect, it } from "vitest";
import {
  gunYayinda,
  haftaBasiGecerliMi,
  isoHaftaBasi,
  yayindakiKayitlar,
  yayinZamaniMetni,
} from "./yayin";

describe("isoHaftaBasi", () => {
  it("pazartesiyi kendine döndürür", () => {
    expect(isoHaftaBasi("2026-10-19")).toBe("2026-10-19");
  });

  it("hafta ortasını pazartesiye çeker", () => {
    expect(isoHaftaBasi("2026-10-24")).toBe("2026-10-19"); // Cumartesi
    expect(isoHaftaBasi("2026-10-25")).toBe("2026-10-19"); // Pazar
  });

  it("ay/yıl sınırını doğru geçer", () => {
    expect(isoHaftaBasi("2027-01-01")).toBe("2026-12-28");
  });

  it("geçersiz metinde null döner", () => {
    expect(isoHaftaBasi("24.10.2026")).toBeNull();
    expect(isoHaftaBasi("2026-02-31")).toBeNull();
  });
});

describe("haftaBasiGecerliMi", () => {
  it("yalnızca pazartesiyi kabul eder", () => {
    expect(haftaBasiGecerliMi("2026-10-19")).toBe(true);
    expect(haftaBasiGecerliMi("2026-10-20")).toBe(false);
  });

  it("bozuk girdileri reddeder", () => {
    expect(haftaBasiGecerliMi("")).toBe(false);
    expect(haftaBasiGecerliMi("2026-13-01")).toBe(false);
    expect(haftaBasiGecerliMi("x")).toBe(false);
  });
});

describe("yayın filtresi", () => {
  const rows = [
    { date: "2026-10-19", ad: "yayında" },
    { date: "2026-10-23", ad: "yayında" },
    { date: "2026-10-26", ad: "taslak" },
  ];

  it("gunYayinda haftaya bakar", () => {
    const yayin = new Set(["2026-10-19"]);
    expect(gunYayinda("2026-10-23", yayin)).toBe(true);
    expect(gunYayinda("2026-10-26", yayin)).toBe(false);
  });

  it("yayindakiKayitlar taslak haftayı eler", () => {
    const kalan = yayindakiKayitlar(rows, ["2026-10-19"]);
    expect(kalan).toHaveLength(2);
    expect(kalan.every((r) => r.ad === "yayında")).toBe(true);
  });

  it("hiç yayın yoksa hiçbir kayıt dönmez", () => {
    expect(yayindakiKayitlar(rows, [])).toHaveLength(0);
  });
});

describe("yayinZamaniMetni", () => {
  it("boş/bozuk değerde boş metin döner", () => {
    expect(yayinZamaniMetni("")).toBe("");
    expect(yayinZamaniMetni("bozuk")).toBe("");
  });

  it("geçerli ISO değeri biçimlendirir", () => {
    const metin = yayinZamaniMetni("2026-10-24T11:05:00.000Z");
    expect(metin).toContain("2026");
    expect(metin).toContain("14:05"); // Türkiye saati (UTC+3)
  });
});
