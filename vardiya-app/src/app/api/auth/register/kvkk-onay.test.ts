import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * KVKK kapısı — kayıt, aydınlatma onayı olmadan **açılmamalı**.
 *
 * Patron isteği (30 Eki 2026): "KVKK'dan ceza yemeyeceğim hale getir".
 * Aydınlatma metni onayı olmadan hesap açılırsa ispat yükü karşılanamaz;
 * bu yüzden kapı hem formda (required) hem sunucuda (bu test) kapalıdır.
 *
 * Veritabanı ve SMTP gerekmez: tüm katmanlar taklit edilir.
 */

const takip = vi.hoisted(() => ({
  hesapOlustur: vi.fn(),
  onayKaydet: vi.fn(),
  kullaniciBul: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: takip.kullaniciBul } },
}));

vi.mock("@/lib/auth", () => ({
  COOKIE_NAME: "vardiya_oturum",
  cerezAyarlari: () => ({ httpOnly: true, path: "/" }),
  girdilerGecerliMi: () => null,
  sifreOzetle: async () => "ozet",
}));

vi.mock("@/lib/session", () => ({
  oturumAltyapisiHazir: () => true,
  oturumTokeni: async () => "jeton",
}));

vi.mock("@/lib/url", () => ({
  disAdres: (req: Request, yol: string) => new URL(yol, req.url),
  guvenliHedef: (deger: string, varsayilan: string) => deger || varsayilan,
  httpsMi: () => false,
  istemciIp: () => "127.0.0.1",
}));

vi.mock("@/lib/giris-korumasi", () => ({
  beklemeMetni: () => "1 dakika",
  girisBasarisiz: async () => {},
  girisDenetle: async () => ({ izinli: true, bekleSaniye: 0 }),
}));

vi.mock("@/lib/hesap-olustur", () => ({ hesapOlustur: takip.hesapOlustur }));

vi.mock("@/lib/kvkk", () => ({
  AYDINLATMA_SURUMU: "2026-10-30",
  aydinlatmaOnayiKaydet: takip.onayKaydet,
  aydinlatmaOnayi: async () => null,
}));

import { POST } from "./route";

function form(govde: Record<string, string>): Request {
  const fd = new FormData();
  for (const [k, v] of Object.entries(govde)) fd.set(k, v);
  return new Request("https://zihnora.com.tr/api/auth/register", {
    method: "POST",
    body: fd,
  });
}

const gecerliGovde = {
  email: "yeni@isletme.com",
  sifre: "cok-gizli-sifre",
  sifreTekrar: "cok-gizli-sifre",
};

beforeEach(() => {
  takip.hesapOlustur.mockReset();
  takip.onayKaydet.mockReset();
  takip.kullaniciBul.mockReset();
  takip.kullaniciBul.mockResolvedValue(null);
  takip.hesapOlustur.mockResolvedValue({ id: "u1", sessionVersion: 0 });
  takip.onayKaydet.mockResolvedValue(true);
});

describe("kayıt — KVKK aydınlatma onayı", () => {
  it("onay kutusu işaretlenmezse hesap açmaz", async () => {
    const yanit = await POST(form(gecerliGovde));

    expect(yanit.status).toBe(303);
    expect(yanit.headers.get("location")).toContain("hata=");
    expect(takip.hesapOlustur).not.toHaveBeenCalled();
    expect(takip.onayKaydet).not.toHaveBeenCalled();
  });

  it("onay kutusu 'on' dışında bir değerse reddeder", async () => {
    const yanit = await POST(form({ ...gecerliGovde, kvkkOnay: "false" }));

    expect(yanit.status).toBe(303);
    expect(takip.hesapOlustur).not.toHaveBeenCalled();
  });

  it("onay verilirse hesabı açar ve onay kaydını yazar", async () => {
    const yanit = await POST(form({ ...gecerliGovde, kvkkOnay: "on" }));

    expect(yanit.status).toBe(303);
    expect(takip.hesapOlustur).toHaveBeenCalledTimes(1);
    expect(takip.onayKaydet).toHaveBeenCalledWith({
      userId: "u1",
      ip: "127.0.0.1",
    });
  });
});
