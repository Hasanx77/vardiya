import { beforeEach, describe, expect, it, vi } from "vitest";
import { haftaBasiISO } from "@/lib/dates";

/**
 * Küçük düzeltme: `hafta` parametresi doğrulanıyor ve pazartesiye hizalanıyor.
 *
 * Önceden yalnız `/^\d{4}-\d{2}-\d{2}$/` bakılıyordu: `2026-13-45` gibi değerler
 * `Invalid Date` üretip PDF'i 500'e düşürüyor, Çarşamba verilirse hafta
 * Çarşamba–Salı olarak çiziliyordu.
 */

const takip = vi.hoisted(() => ({
  kullanici: vi.fn(),
  isletme: vi.fn(),
  pdf: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ aktifKullanici: takip.kullanici }));
vi.mock("@/lib/server-data", () => ({ ensureBusiness: takip.isletme }));
vi.mock("@/lib/plan-pdf", () => ({ planPdfUret: takip.pdf }));

import { GET } from "./route";

const istek = (hafta: string) =>
  new Request(`https://zihnora.com.tr/api/plan/pdf?hafta=${encodeURIComponent(hafta)}`);

beforeEach(() => {
  vi.clearAllMocks();
  takip.kullanici.mockResolvedValue({ id: "u1", email: "a@b.com" });
  takip.isletme.mockResolvedValue({ id: "b1", name: "Kafe" });
  takip.pdf.mockResolvedValue({ pdf: new Uint8Array([1]), dosyaAdi: "x.pdf" });
});

describe("GET /api/plan/pdf", () => {
  it("geçersiz tarihi bugünün haftasına çevirir (500 değil)", async () => {
    const yanit = await GET(istek("2026-13-45"));
    expect(yanit.status).toBe(200);
    expect(takip.pdf).toHaveBeenCalledWith("b1", haftaBasiISO(new Date()));
  });

  it("hafta ortası verilirse pazartesiye hizalar", async () => {
    await GET(istek("2026-10-07")); // Çarşamba
    expect(takip.pdf).toHaveBeenCalledWith("b1", "2026-10-05");
  });

  it("geçerli pazartesiyi olduğu gibi kullanır", async () => {
    await GET(istek("2026-10-05"));
    expect(takip.pdf).toHaveBeenCalledWith("b1", "2026-10-05");
  });
});
