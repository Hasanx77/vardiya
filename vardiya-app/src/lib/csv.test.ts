import { describe, expect, it } from "vitest";
import { csvHucre, csvMetni } from "./csv";

describe("csvHucre", () => {
  it("normal metni tırnak içine alır", () => {
    expect(csvHucre("Ayşe Yılmaz")).toBe('"Ayşe Yılmaz"');
  });

  it("içindeki tırnağı ikiler", () => {
    expect(csvHucre('Ayşe "A" Yılmaz')).toBe('"Ayşe ""A"" Yılmaz"');
  });

  it("noktalı virgülü bozmadan korur", () => {
    expect(csvHucre("Barista; Şef")).toBe('"Barista; Şef"');
  });

  it("formül enjeksiyonunu etkisizleştirir", () => {
    expect(csvHucre("=1+1")).toBe("\"'=1+1\"");
    expect(csvHucre("+90")).toBe("\"'+90\"");
    expect(csvHucre("@topla")).toBe("\"'@topla\"");
    expect(csvHucre("-5")).toBe("\"'-5\"");
  });

  it("sayıyı metne çevirir", () => {
    expect(csvHucre(45)).toBe('"45"');
  });
});

describe("csvMetni", () => {
  it("BOM ve CRLF ile satırları birleştirir", () => {
    const csv = csvMetni([
      ["Ad", "Saat"],
      ["Ayşe", 40],
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Ad";"Saat"\r\n"Ayşe";"40"');
  });
});
