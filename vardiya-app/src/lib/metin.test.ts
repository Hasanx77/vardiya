import { describe, expect, it } from "vitest";
import { harfVarMi, metinNormalize, metinNormalizeCokSatir, telefonTemizle } from "./metin";
import { kullaniciAdiGecerliMi, kullaniciAdiHatasi, kullaniciAdiTemizle } from "./kullanici-adi";

/**
 * Türkçe / global karakter desteği.
 * Patron: "işletme adı girerken Türkçe karakterlerde sıkıntı olmasın."
 */
describe("metin normalizasyonu", () => {
  it("Türkçe karakterleri olduğu gibi korur", () => {
    expect(metinNormalize("Şık Kafe & Börek Evi — Işıl Öğüt")).toBe(
      "Şık Kafe & Börek Evi — Işıl Öğüt",
    );
  });

  it("birleşik işaretli harfi NFC ile tek karaktere indirir", () => {
    // "s" + birleşik çengel (U+0327) → "ş"
    expect(metinNormalize("s\u0327eker")).toBe("şeker");
    expect(metinNormalize("s\u0327eker").length).toBe(5);
  });

  it("kontrol karakterlerini temizler, satır sonunu korur", () => {
    expect(metinNormalize("a\u0000b\u0007c")).toBe("abc");
    expect(metinNormalizeCokSatir("bir\n\n\n\niki")).toBe("bir\n\niki");
  });

  it("uzunluğu kırpar ve boşlukları temizler", () => {
    expect(metinNormalize("  abcdef  ", 3)).toBe("abc");
    expect(metinNormalize("  iki kelime  ")).toBe("iki kelime");
  });

  it("telefonu harflerden arındırır ama numarayı bozmaz", () => {
    expect(telefonTemizle("+90 (532) 111 22 33")).toBe("+90 (532) 111 22 33");
    expect(telefonTemizle("0532 abc 11 22")).toBe("0532 11 22");
  });

  it("harf var mı kontrolü Unicode bilir", () => {
    expect(harfVarMi("Şık")).toBe(true);
    expect(harfVarMi("1234")).toBe(false);
  });
});

describe("kullanıcı adı — Türkçe karakter", () => {
  it("Türkçe harfleri korur ve Türkçe küçültür", () => {
    expect(kullaniciAdiTemizle("Işıl Öğüt")).toBe("ışıl-öğüt");
    expect(kullaniciAdiTemizle("İREM")).toBe("irem");
  });

  it("Türkçe karakterli ad geçerlidir", () => {
    expect(kullaniciAdiGecerliMi("ışıl")).toBe(true);
    expect(kullaniciAdiGecerliMi("çiğdem.k")).toBe(true);
    expect(kullaniciAdiHatasi("ışıl")).toBeNull();
  });

  it("çok kısa ve tamamen geçersiz adları reddeder", () => {
    expect(kullaniciAdiGecerliMi("ab")).toBe(false);
    expect(kullaniciAdiGecerliMi("!!!")).toBe(false);
  });

  it("diğer dillerdeki harfleri de kabul eder", () => {
    expect(kullaniciAdiGecerliMi("müller")).toBe(true);
    expect(kullaniciAdiGecerliMi("иван")).toBe(true);
  });
});
