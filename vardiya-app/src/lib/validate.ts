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
