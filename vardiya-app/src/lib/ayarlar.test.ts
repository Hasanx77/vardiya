import { describe, expect, it } from "vitest";
import { VARSAYILAN_AYARLAR, ayarNormalize } from "./ayarlar";

describe("ayar normalizasyonu", () => {
  it("boş kayıtta varsayılanları döner", () => {
    expect(ayarNormalize(null)).toEqual(VARSAYILAN_AYARLAR);
    expect(ayarNormalize({})).toEqual(VARSAYILAN_AYARLAR);
  });

  it("bayrakları 1/0 olarak okur", () => {
    const a = ayarNormalize({ bildirimYayin: "0", bildirimIzin: "1", bildirimOzet: "1" });
    expect(a.bildirimYayin).toBe(false);
    expect(a.bildirimIzin).toBe(true);
    expect(a.bildirimOzet).toBe(true);
  });

  it("geçersiz tema sistem'e düşer", () => {
    expect(ayarNormalize({ tema: "mor" }).tema).toBe("sistem");
    expect(ayarNormalize({ tema: "koyu" }).tema).toBe("koyu");
    expect(ayarNormalize({ tema: "acik" }).tema).toBe("acik");
  });

  it("bilinmeyen anahtarları yok sayar", () => {
    const a = ayarNormalize({ alakasiz: "1" });
    expect(a).toEqual(VARSAYILAN_AYARLAR);
  });
});
