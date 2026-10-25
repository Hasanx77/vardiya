import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O-3 — personel linki / takvim uçları için hız sınırı.
 *
 * Sayaç veritabanında tutulur (paylaşımlı, süreç yeniden başlasa da korunur).
 * Çekirdek hesap saf fonksiyondur; veritabanı hatasında **fail-open** davranır
 * (personel programı DB hatası yüzünden kilitlenmesin).
 */

const takip = vi.hoisted(() => ({
  query: vi.fn(),
  exec: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRawUnsafe: takip.query, $executeRawUnsafe: takip.exec },
}));

import { hizDenetle, pencereDurumu } from "./hiz-siniri";

const DAKIKA = 60_000;

describe("pencereDurumu (saf)", () => {
  it("ilk istekte izin verir ve sayacı 1 yapar", () => {
    const s = pencereDurumu(null, 1_000_000, 5, DAKIKA);
    expect(s.izinli).toBe(true);
    expect(s.sayi).toBe(1);
  });

  it("eşiğin altında izin verir", () => {
    const s = pencereDurumu({ sayi: 4, pencereBaslangic: 1_000_000 }, 1_010_000, 5, DAKIKA);
    expect(s.izinli).toBe(true);
    expect(s.sayi).toBe(5);
  });

  it("eşiğe ulaşınca reddeder ve sayacı artırmaz", () => {
    const s = pencereDurumu({ sayi: 5, pencereBaslangic: 1_000_000 }, 1_010_000, 5, DAKIKA);
    expect(s.izinli).toBe(false);
    expect(s.sayi).toBe(5);
  });

  it("pencere dolunca sıfırlar", () => {
    const s = pencereDurumu({ sayi: 5, pencereBaslangic: 1_000_000 }, 1_000_000 + DAKIKA, 5, DAKIKA);
    expect(s.izinli).toBe(true);
    expect(s.sayi).toBe(1);
    expect(s.pencereBaslangic).toBe(1_000_000 + DAKIKA);
  });

  it("pencere içinde kalan süreyi doğru hesaplar", () => {
    const s = pencereDurumu({ sayi: 2, pencereBaslangic: 1_000_000 }, 1_030_000, 5, DAKIKA);
    expect(s.kalan).toBe(2); // 5 - 3
  });
});

describe("hizDenetle (veritabanı)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    takip.query.mockResolvedValue([]);
    takip.exec.mockResolvedValue(1);
  });

  it("ilk istekte sayaç yazar ve izin verir", async () => {
    const s = await hizDenetle("ekip:ip:1.2.3.4", 60, DAKIKA);
    expect(s.izinli).toBe(true);
    expect(takip.exec).toHaveBeenCalled();
  });

  it("kayıt varsa okur ve sınırı uygular", async () => {
    takip.query.mockResolvedValue([
      { sayi: 60, pencereBaslangic: new Date().toISOString() },
    ]);
    const s = await hizDenetle("ekip:ip:1.2.3.4", 60, DAKIKA);
    expect(s.izinli).toBe(false);
  });

  it("veritabanı hata verirse fail-open (izin verir)", async () => {
    takip.query.mockRejectedValue(new Error("kilitli"));
    const hata = vi.spyOn(console, "error").mockImplementation(() => {});
    const s = await hizDenetle("ekip:ip:1.2.3.4", 1, DAKIKA);
    expect(s.izinli).toBe(true);
    hata.mockRestore();
  });
});
