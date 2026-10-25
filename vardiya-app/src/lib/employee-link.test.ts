import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O-1 — personel bağlantı jetonuna **son kullanma** eklendi.
 *
 * Yeni biçim: `<personelId>.<sonKullanmaMs>.<imza>`
 * Eski biçim: `<personelId>.<imza>` (süresiz) — paylaşılmış linkler kırılmasın
 * diye hâlâ kabul edilir, yeni linkler 90 gün geçerlidir.
 */

const takip = vi.hoisted(() => ({
  query: vi.fn(),
  exec: vi.fn(),
}));

vi.mock("./prisma", () => ({
  prisma: { $queryRawUnsafe: takip.query, $executeRawUnsafe: takip.exec },
}));

const ANAHTAR = "t".repeat(32);

import { LINK_GECERLILIK_GUN, linkDurumu, tokenCoz, tokenUret } from "./employee-link";

function eskiBicimJeton(id: string, version: number): string {
  const imza = createHmac("sha256", ANAHTAR)
    .update(`ekip:${id}:${version}`)
    .digest("base64url")
    .slice(0, 24);
  return `${id}.${imza}`;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("AUTH_SECRET", ANAHTAR);
  takip.query.mockResolvedValue([{ version: 0 }]);
  takip.exec.mockResolvedValue(1);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("tokenUret", () => {
  it("üç parçalı jeton üretir", () => {
    const jeton = tokenUret("abc", 0);
    expect(jeton.split(".")).toHaveLength(3);
  });

  it("son kullanma gelecekte ve ~90 gün sonra", () => {
    const son = Number(tokenUret("abc", 0).split(".")[1]);
    const gun = 24 * 60 * 60 * 1000;
    expect(son).toBeGreaterThan(Date.now());
    expect(son).toBeLessThanOrEqual(Date.now() + (LINK_GECERLILIK_GUN + 1) * gun);
  });

  it("aynı gün içinde aynı jetonu üretir (link her açılışta değişmesin)", () => {
    expect(tokenUret("abc", 0)).toBe(tokenUret("abc", 0));
  });
});

describe("tokenCoz", () => {
  it("geçerli jetonu çözer", async () => {
    await expect(tokenCoz(tokenUret("abc", 0))).resolves.toBe("abc");
  });

  it("süresi geçmiş jetonu reddeder", async () => {
    const jeton = tokenUret("abc", 0, Date.now() - 1000);
    await expect(tokenCoz(jeton)).resolves.toBeNull();
  });

  it("kurcalanmış imzayı reddeder", async () => {
    const [id, son, imza] = tokenUret("abc", 0).split(".");
    const bozuk = `${id}.${son}.${imza.slice(0, -1)}${imza.endsWith("A") ? "B" : "A"}`;
    await expect(tokenCoz(bozuk)).resolves.toBeNull();
  });

  it("eski iki parçalı jetonu hâlâ kabul eder (geriye uyum)", async () => {
    await expect(tokenCoz(eskiBicimJeton("abc", 0))).resolves.toBe("abc");
  });

  it("kapatılmış linkte (sürüm -1) hiçbir jeton çalışmaz", async () => {
    takip.query.mockResolvedValue([{ version: -1 }]);
    await expect(tokenCoz(tokenUret("abc", 0))).resolves.toBeNull();
    await expect(tokenCoz(eskiBicimJeton("abc", 0))).resolves.toBeNull();
  });

  it("eski sürüm numarasıyla üretilmiş jetonu reddeder (yenileme çalışsın)", async () => {
    const eski = tokenUret("abc", 0);
    takip.query.mockResolvedValue([{ version: 1 }]);
    await expect(tokenCoz(eski)).resolves.toBeNull();
  });

  it("geçersiz biçimleri reddeder", async () => {
    await expect(tokenCoz("")).resolves.toBeNull();
    await expect(tokenCoz("abc")).resolves.toBeNull();
    await expect(tokenCoz("abc.def.ghi.jkl")).resolves.toBeNull();
    await expect(tokenCoz("abc;drop.1.2")).resolves.toBeNull();
  });
});

describe("linkDurumu", () => {
  it("jeton ve son kullanma bilgisini döner", async () => {
    const durum = await linkDurumu("abc");
    expect(durum.aktif).toBe(true);
    expect(durum.token).toBeTruthy();
    expect(durum.sonKullanma).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("kapatılmış linkte token null döner", async () => {
    takip.query.mockResolvedValue([{ version: -1 }]);
    const durum = await linkDurumu("abc");
    expect(durum.aktif).toBe(false);
    expect(durum.token).toBeNull();
    expect(durum.sonKullanma).toBeNull();
  });
});
