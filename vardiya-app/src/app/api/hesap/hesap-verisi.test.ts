import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * K-1 regresyon testi — e-posta eşleşmesiyle üçüncü kişi verisi.
 *
 * Kural: "verilerimi indir" ve "hesabımı sil" uçları **yalnızca oturumdaki
 * kullanıcının kendi verisine** dokunur. E-posta adresi eşleşmesiyle başka
 * kişilerin iletişim mesajlarına erişmek/silmek yasaktır.
 *
 * Test, veritabanına ve SMTP'ye ihtiyaç duymaz: Prisma, oturum ve state
 * katmanları taklit edilir.
 */

const takip = vi.hoisted(() => ({
  epostaylaGetir: vi.fn(),
  epostaylaSil: vi.fn(),
  kullaniciSil: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  aktifKullanici: async () => ({
    id: "u1",
    email: "kurban@ornek.com",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    lastLoginAt: null,
  }),
}));

vi.mock("@/lib/state", () => ({
  getStatePayload: async () => ({
    business: { id: "b1", name: "Örnek Kafe", openTime: "09:00", closeTime: "23:00" },
    employees: [],
    shiftTemplates: [],
    assignments: [],
    announcements: [],
    dayNotes: [],
    publishedWeeks: [],
  }),
}));

vi.mock("@/lib/messages", () => ({
  mesajlariEpostaylaGetir: takip.epostaylaGetir,
  mesajlariEpostaylaSil: takip.epostaylaSil,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { delete: takip.kullaniciSil } },
}));

import { GET as veriIndir } from "./veri/route";
import { POST as hesapSil } from "./sil/route";

beforeEach(() => {
  vi.clearAllMocks();
  takip.epostaylaGetir.mockResolvedValue([
    {
      id: "m1",
      ad: "Kurban Kullanıcı",
      email: "kurban@ornek.com",
      mesaj: "GIZLI-MESAJ-ICERIGI",
      okundu: false,
      createdAt: new Date("2026-02-01T10:00:00Z"),
    },
  ]);
  takip.epostaylaSil.mockResolvedValue(undefined);
  takip.kullaniciSil.mockResolvedValue({ id: "u1" });
});

describe("GET /api/hesap/veri", () => {
  it("üçüncü kişilerin iletişim mesajlarını dışa aktarmaz", async () => {
    const yanit = await veriIndir();
    const govde = await yanit.text();

    expect(govde).not.toContain("GIZLI-MESAJ-ICERIGI");
    expect(govde).not.toContain("gonderdigimMesajlar");
    // E-posta ile mesaj arama primitifi hiç çağrılmamalı.
    expect(takip.epostaylaGetir).not.toHaveBeenCalled();
  });
});

describe("POST /api/hesap/sil", () => {
  it("e-postayla eşleşen yabancı iletişim mesajlarını silmez", async () => {
    const istek = new Request("https://zihnora.com.tr/api/hesap/sil", { method: "POST" });
    await hesapSil(istek);

    // Hesap silinir…
    expect(takip.kullaniciSil).toHaveBeenCalledTimes(1);
    // …ama e-posta eşleşmesiyle başka kişilerin mesajlarına dokunulmaz.
    expect(takip.epostaylaSil).not.toHaveBeenCalled();
  });
});
