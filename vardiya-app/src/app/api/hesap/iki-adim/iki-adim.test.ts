import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Y-4 regresyon testi — 2FA kurulumu şifre ister.
 *
 * Önceden `baslat`/`etkinlestir` yalnız oturum çereziyle çalışıyordu. Çalınmış
 * bir çerezle saldırgan kendi authenticator'ını bağlayıp hesabın sahibini
 * kilitleyebiliyordu. Artık şifre doğrulanmadan kurulum başlamaz.
 */

const takip = vi.hoisted(() => ({
  aktifKullanici: vi.fn(),
  sifreDogru: vi.fn(),
  ikiAdimDurumu: vi.fn(),
  kurulumBaslat: vi.fn(),
  etkinlestir: vi.fn(),
  kodDogrula: vi.fn(),
  kapat: vi.fn(),
  yedekYenile: vi.fn(),
  denetle: vi.fn(),
  basarisiz: vi.fn(),
  temizle: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  aktifKullanici: takip.aktifKullanici,
  sifreDogruMu: takip.sifreDogru,
}));

vi.mock("@/lib/iki-adim", () => ({
  ikiAdimDurumu: takip.ikiAdimDurumu,
  kurulumBaslat: takip.kurulumBaslat,
  etkinlestir: takip.etkinlestir,
  kodDogrulaKullanici: takip.kodDogrula,
  kapat: takip.kapat,
  yedekYenile: takip.yedekYenile,
}));

vi.mock("@/lib/giris-korumasi", () => ({
  girisDenetle: takip.denetle,
  girisBasarisiz: takip.basarisiz,
  girisTemizle: takip.temizle,
}));

import { POST } from "./route";

const istek = (govde: unknown) =>
  new Request("https://zihnora.com.tr/api/hesap/iki-adim", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(govde),
  });

beforeEach(() => {
  vi.clearAllMocks();
  takip.aktifKullanici.mockResolvedValue({
    id: "u1",
    email: "hasan@ornek.com",
    passwordHash: "scrypt$tuz$ozet",
  });
  takip.sifreDogru.mockResolvedValue(true);
  takip.ikiAdimDurumu.mockResolvedValue({ aktif: false, yedekKalan: 0, kurulumVar: false });
  takip.kurulumBaslat.mockResolvedValue({ sir: "ABC123", adres: "otpauth://x" });
  takip.etkinlestir.mockResolvedValue(["AAAA-BBBB"]);
  takip.denetle.mockResolvedValue({ izinli: true, bekleSaniye: 0 });
});

describe("islem=baslat", () => {
  it("şifre yoksa kurulum başlamaz", async () => {
    const yanit = await POST(istek({ islem: "baslat" }));
    expect(yanit.status).toBe(400);
    expect(takip.kurulumBaslat).not.toHaveBeenCalled();
  });

  it("şifre yanlışsa kurulum başlamaz ve sayaç artar", async () => {
    takip.sifreDogru.mockResolvedValue(false);
    const yanit = await POST(istek({ islem: "baslat", sifre: "yanlis" }));

    expect(yanit.status).toBe(400);
    expect(takip.kurulumBaslat).not.toHaveBeenCalled();
    expect(takip.basarisiz).toHaveBeenCalled();
  });

  it("şifre doğruysa kurulum başlar", async () => {
    const yanit = await POST(istek({ islem: "baslat", sifre: "dogru-sifre" }));
    const govde = (await yanit.json()) as { ok?: boolean; sir?: string };

    expect(yanit.status).toBe(200);
    expect(govde.sir).toBe("ABC123");
    expect(takip.kurulumBaslat).toHaveBeenCalledTimes(1);
  });
});

describe("islem=etkinlestir", () => {
  it("şifre yoksa 2FA açılmaz", async () => {
    const yanit = await POST(istek({ islem: "etkinlestir", kod: "123456" }));
    expect(yanit.status).toBe(400);
    expect(takip.etkinlestir).not.toHaveBeenCalled();
  });

  it("şifre doğruysa 2FA açılır", async () => {
    const yanit = await POST(
      istek({ islem: "etkinlestir", kod: "123456", sifre: "dogru-sifre" }),
    );
    expect(yanit.status).toBe(200);
    expect(takip.etkinlestir).toHaveBeenCalledWith("u1", "123456");
  });
});
