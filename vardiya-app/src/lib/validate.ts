import { COLOR_PALETTE } from "./colors";

/** "9:5" gibi girişleri "09:05" biçimine getirir; geçersizse "" döner */
export function normalizeTime(v: unknown): string {
  const s = String(v ?? "").trim();
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(s);
  if (!m) return "";
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

export function isValidColor(v: unknown): boolean {
  return typeof v === "string" && (COLOR_PALETTE as readonly string[]).includes(v);
}

export function cleanText(v: unknown, max = 60): string {
  return String(v ?? "").trim().slice(0, max);
}

/**
 * "YYYY-MM-DD" biçiminde **gerçek** bir tarih mi?
 * (2026-02-31 gibi takvimde olmayan günleri de reddeder.)
 */
export function isValidISODate(v: unknown): boolean {
  const s = String(v ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;

  const [y, m, d] = s.split("-").map(Number);
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;

  const t = new Date(Date.UTC(y, m - 1, d));
  return (
    t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
  );
}

/** Sayıyı güvenli aralığa sıkıştırır; geçersizse varsayılanı döner. */
export function sinirliTamSayi(v: unknown, min: number, max: number, varsayilan: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return varsayilan;
  return Math.min(max, Math.max(min, Math.round(n)));
}
