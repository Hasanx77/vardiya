import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Y-1 regresyon testi — çıkışta oturum **sunucuda** geçersizleşir.
 *
 * Oturum çerezi imzalı ama sunucu tarafında durum tutmuyor (stateless). Bu
 * yüzden çerez silmek yetmez: çalınmış bir kopya 30 gün boyunca çalışmaya devam
 * ederdi. Çıkışta `sessionVersion` artırılır → eski çerezdeki sürüm uyuşmaz.
 */

const takip = vi.hoisted(() => ({
  kullaniciId: vi.fn(),
  guncelle: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ aktifKullaniciId: takip.kullaniciId }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { update: takip.guncelle } } }));

import { GET, POST } from "./route";

const istek = () =>
  new Request("https://zihnora.com.tr/api/auth/logout", { method: "POST" });

beforeEach(() => {
  vi.clearAllMocks();
  takip.kullaniciId.mockResolvedValue("u1");
  takip.guncelle.mockResolvedValue({ id: "u1", sessionVersion: 3 });
});

describe("POST /api/auth/logout", () => {
  it("oturum sürümünü artırır (eski çerezler ölür)", async () => {
    await POST(istek());

    expect(takip.guncelle).toHaveBeenCalledTimes(1);
    expect(takip.guncelle).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { sessionVersion: { increment: 1 } },
      select: expect.anything(),
    });
  });

  it("oturum yoksa veritabanına dokunmaz", async () => {
    takip.kullaniciId.mockResolvedValue(null);
    await POST(istek());
    expect(takip.guncelle).not.toHaveBeenCalled();
  });

  it("veritabanı hata verse bile çıkış tamamlanır (çerez silinir)", async () => {
    takip.guncelle.mockRejectedValue(new Error("kilitli"));
    const yanit = await POST(istek());

    expect(yanit.status).toBe(303);
    const cerez = yanit.headers.get("set-cookie") ?? "";
    expect(cerez).toContain("vardiya_oturum=");
    expect(cerez.toLowerCase()).toContain("max-age=0");
  });

  it("çerezi her durumda siler", async () => {
    const yanit = await POST(istek());
    const cerez = yanit.headers.get("set-cookie") ?? "";
    expect(cerez.toLowerCase()).toContain("max-age=0");
  });
});

describe("GET /api/auth/logout", () => {
  it("aynı geçersizleştirmeyi yapar (çıkış yanılsama olmasın)", async () => {
    await GET(new Request("https://zihnora.com.tr/api/auth/logout"));
    expect(takip.guncelle).toHaveBeenCalledTimes(1);
  });
});
