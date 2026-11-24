import { describe, expect, it } from "vitest";
import {
  AZAMI_DENEME,
  KOD_OMRU_DK,
  kodDurumu,
  kodHataMetni,
  kodOzetle,
  koduTemizle,
  kodBicimiGecerliMi,
  koduMaskele,
  kalanSaniye,
  kalanSureMetni,
  ozetEsitMi,
} from "./eposta-kodu";

describe("e-posta kodu kuralları", () => {
  it("kodu yazım farklarından temizler", () => {
    expect(koduTemizle("123 456")).toBe("123456");
    expect(koduTemizle("12-34-56")).toBe("123456");
    expect(koduTemizle("abcdef")).toBe("");
  });

  it("yalnız 6 haneyi geçerli sayar", () => {
    expect(kodBicimiGecerliMi("123456")).toBe(true);
    expect(kodBicimiGecerliMi("12345")).toBe(false);
    expect(kodBicimiGecerliMi("1234567")).toBe(false);
  });

  it("özet e-posta ve amaca bağlıdır", () => {
    process.env.AUTH_SECRET = "test-sir";
    const a = kodOzetle("123456", "a@b.com", "giris");
    expect(a).toBe(kodOzetle("123456", " A@B.com ", "giris"));
    expect(a).not.toBe(kodOzetle("123456", "a@b.com", "sifre"));
    expect(a).not.toBe(kodOzetle("654321", "a@b.com", "giris"));
    expect(ozetEsitMi(a, a)).toBe(true);
    expect(ozetEsitMi(a, a.slice(0, -2) + "00")).toBe(false);
  });

  it("süresi dolmuş kodu reddeder", () => {
    const gecmis = new Date(Date.now() - 1000).toISOString();
    expect(kodDurumu({ sonKullanma: gecmis, deneme: 0, tuketildi: 0 })).toBe("suresi-doldu");
  });

  it("tüketilmiş kodu reddeder", () => {
    const gelecek = new Date(Date.now() + KOD_OMRU_DK * 60_000).toISOString();
    expect(kodDurumu({ sonKullanma: gelecek, deneme: 0, tuketildi: 1 })).toBe("tuketildi");
  });

  it("deneme limitinde kilitler", () => {
    const gelecek = new Date(Date.now() + 60_000).toISOString();
    expect(kodDurumu({ sonKullanma: gelecek, deneme: AZAMI_DENEME, tuketildi: 0 })).toBe(
      "deneme-limiti",
    );
    expect(kodDurumu({ sonKullanma: gelecek, deneme: AZAMI_DENEME - 1, tuketildi: 0 })).toBe(
      "gecerli",
    );
  });

  it("kalan süreyi negatife düşürmez", () => {
    const gecmis = new Date(Date.now() - 5000).toISOString();
    expect(kalanSaniye(gecmis)).toBe(0);
    expect(kalanSureMetni(0)).toBe("0 sn");
    expect(kalanSureMetni(200)).toBe("3 dk 20 sn");
  });

  it("kod maskesinde tam kod görünmez", () => {
    expect(koduMaskele("123456")).toBe("123•••");
    expect(koduMaskele("1")).toBe("•••");
  });

  it("hata metinleri boş değildir", () => {
    expect(kodHataMetni("gecerli")).toBe("");
    expect(kodHataMetni("suresi-doldu")).toContain("süresi doldu");
  });
});
