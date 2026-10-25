import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Y-3 regresyon testi — hesap silinince ham SQL tabloları da temizlenir.
 *
 * `IkiAdim` TOTP sırrını, `EmployeeLink` personel bağlantı sürümünü,
 * `GirisDenemesi` e-posta adresini tutar. Bunlar Prisma modeli olmadığı için
 * `user.delete` cascade'i bunlara dokunmaz.
 */

const takip = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  exec: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRawUnsafe: takip.queryRaw,
    $executeRawUnsafe: takip.exec,
  },
}));

import { kullaniciArtiKayitlariSil, likeKacir } from "./hesap-temizligi";

beforeEach(() => {
  vi.clearAllMocks();
  takip.queryRaw.mockResolvedValue([]);
  takip.exec.mockResolvedValue(1);
});

describe("likeKacir", () => {
  it("LIKE jokerlerini kaçırır (fazla silme olmasın)", () => {
    expect(likeKacir("a_b%c\\d")).toBe("a\\_b\\%c\\\\d");
  });

  it("normal e-postaya dokunmaz", () => {
    expect(likeKacir("hasan@ornek.com")).toBe("hasan@ornek.com");
  });
});

describe("kullaniciArtiKayitlariSil", () => {
  it("personel bağlantılarını işletme üzerinden siler", async () => {
    takip.queryRaw.mockResolvedValue([{ id: "e1" }, { id: "e2" }]);

    await kullaniciArtiKayitlariSil({ id: "u1", email: "hasan@ornek.com" });

    const cagrilar = takip.exec.mock.calls.map((c) => String(c[0]));
    const linkSilme = cagrilar.findIndex((s) => s.includes('DELETE FROM "EmployeeLink"'));
    expect(linkSilme).toBeGreaterThanOrEqual(0);

    const parametreler = takip.exec.mock.calls[linkSilme].slice(1);
    expect(parametreler).toEqual(["e1", "e2"]);
  });

  it("personel yoksa EmployeeLink sorgusu çalışmaz", async () => {
    takip.queryRaw.mockResolvedValue([]);

    await kullaniciArtiKayitlariSil({ id: "u1", email: "hasan@ornek.com" });

    const cagrilar = takip.exec.mock.calls.map((c) => String(c[0]));
    expect(cagrilar.some((s) => s.includes('DELETE FROM "EmployeeLink"'))).toBe(false);
  });

  it("TOTP sırrını ve giriş sayaçlarını her durumda siler", async () => {
    await kullaniciArtiKayitlariSil({ id: "u1", email: "hasan@ornek.com" });

    const cagrilar = takip.exec.mock.calls.map((c) => String(c[0]));
    expect(cagrilar.some((s) => s.includes('DELETE FROM "IkiAdim"'))).toBe(true);
    expect(cagrilar.some((s) => s.includes('DELETE FROM "GirisDenemesi"'))).toBe(true);

    const deneme = takip.exec.mock.calls.find((c) =>
      String(c[0]).includes('DELETE FROM "GirisDenemesi"'),
    );
    expect(deneme?.slice(1)).toEqual(
      expect.arrayContaining(["ikiadim:u1", "ikiadim-ayar:u1"]),
    );
  });

  it("bir silme hata verirse diğerleri devam eder ve fırlatmaz", async () => {
    takip.exec
      .mockRejectedValueOnce(new Error("kilitli"))
      .mockResolvedValue(1);

    await expect(
      kullaniciArtiKayitlariSil({ id: "u1", email: "hasan@ornek.com" }),
    ).resolves.toBeDefined();

    const cagrilar = takip.exec.mock.calls.map((c) => String(c[0]));
    expect(cagrilar.some((s) => s.includes('DELETE FROM "GirisDenemesi"'))).toBe(true);
  });

  it("veritabanı okunamazsa da fırlatmaz", async () => {
    takip.queryRaw.mockRejectedValue(new Error("db yok"));
    await expect(
      kullaniciArtiKayitlariSil({ id: "u1", email: "hasan@ornek.com" }),
    ).resolves.toBeDefined();
  });
});
