import { describe, expect, it } from "vitest";
import { sqlKontrol, sqlJsonlastir } from "./sql-guard";

describe("SQL paneli kapısı", () => {
  it("düz SELECT'i kabul eder ve LIMIT ekler", () => {
    const s = sqlKontrol('SELECT * FROM "Employee"');
    expect(s.ok).toBe(true);
    if (s.ok) expect(s.sql).toMatch(/LIMIT 201$/);
  });

  it("kullanıcı LIMIT yazdıysa dokunmaz", () => {
    const s = sqlKontrol('SELECT * FROM "Employee" LIMIT 10');
    expect(s.ok).toBe(true);
    if (s.ok) expect(s.sql).toBe('SELECT * FROM "Employee" LIMIT 10');
  });

  it("sondaki noktalı virgülü kabul eder", () => {
    expect(sqlKontrol('SELECT 1;').ok).toBe(true);
  });

  it("birden çok ifadeyi reddeder", () => {
    const s = sqlKontrol('SELECT 1; DROP TABLE "User"');
    expect(s.ok).toBe(false);
  });

  it("yazma anahtar sözcüklerini reddeder", () => {
    for (const q of [
      'DELETE FROM "User"',
      'UPDATE "User" SET email = 1',
      'DROP TABLE "User"',
      'INSERT INTO "User" VALUES (1)',
      'ALTER TABLE "User" ADD COLUMN x TEXT',
    ]) {
      expect(sqlKontrol(q).ok).toBe(false);
    }
  });

  it("WITH içinde yazma girişimini reddeder", () => {
    const s = sqlKontrol('WITH x AS (SELECT 1) DELETE FROM "User"');
    expect(s.ok).toBe(false);
  });

  it("yorumlarla gizlemeyi reddeder", () => {
    expect(sqlKontrol('SELECT 1 -- ; DROP').ok).toBe(false);
    expect(sqlKontrol('SELECT 1 /* x */').ok).toBe(false);
  });

  it("PRAGMA'da yalnızca okuma alt komutlarına izin verir", () => {
    expect(sqlKontrol("PRAGMA table_info('Employee')").ok).toBe(true);
    expect(sqlKontrol("PRAGMA writable_schema=ON").ok).toBe(false);
    expect(sqlKontrol("PRAGMA journal_mode=DELETE").ok).toBe(false);
  });

  it("boş ve çok uzun sorguyu reddeder", () => {
    expect(sqlKontrol("   ").ok).toBe(false);
    expect(sqlKontrol(`SELECT '${"a".repeat(2500)}'`).ok).toBe(false);
  });

  it("kelime sınırı: createdAt CREATE sayılmaz", () => {
    expect(sqlKontrol('SELECT "createdAt" FROM "User"').ok).toBe(true);
  });

  it("BigInt ve tarih değerlerini JSON'a çevirir", () => {
    const r = sqlJsonlastir([{ n: BigInt(5), d: new Date("2026-11-26T00:00:00Z"), b: new Uint8Array(3), s: "x" }]);
    expect(r[0]).toEqual({ n: 5, d: "2026-11-26T00:00:00.000Z", b: "<3 bayt>", s: "x" });
  });
});
