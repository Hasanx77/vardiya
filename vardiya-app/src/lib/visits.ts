import { createHash, randomUUID } from "node:crypto";
import { after } from "next/server";
import { headers } from "next/headers";
import { prisma } from "./prisma";
import { mesajTemizligi } from "./messages";

/**
 * Çerezsiz, gizlilik dostu ziyaret sayacı.
 *
 * - IP ve tarayıcı bilgisi **saklanmaz**; yalnızca aylık tuzlu SHA-256 özeti.
 * - Aynı kişi aynı gün içinde kaç kez gelirse gelsin tek satır (gün + özet tekil).
 * - Kayıtlar 120 gün sonra silinir.
 * - Üçüncü taraf, çerez veya istemci betiği yok; tamamı kendi sunucumuzda.
 *
 * Tablo, Prisma modeli yerine ham SQL ile kurulur: canlı sunucuda
 * `prisma generate` çalıştırmadan da güvenle çalışsın diye.
 */

const SAHIP_EPOSTALAR = (
  process.env.OWNER_EMAIL ?? "hmum117413@gmail.com,mumhasan508@gmail.com"
)
  .split(/[,;]/)
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
const SAKLAMA_GUN = 120;

const BOT_KALIBI =
  /bot|crawler|spider|slurp|python-requests|python-httpx|curl\/|wget\/|headless|monitor|uptime|scanner|scan\/|gptbot|claudebot|forestengine|recordedfuture|facebookexternalhit|preview|fetcher|httpclient|go-http-client|java\/|okhttp|axios\/|node-fetch|libwww-perl/i;

let tabloHazir = false;
let temizlikGunu = "";

/** Türkiye saatine göre YYYY-MM-DD */
function istanbulGunu(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** YYYY-MM-DD metnine gün ekler (saat dilimi kayması olmadan). */
function gunKaydir(gun: string, delta: number): string {
  const [y, m, d] = gun.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

async function tabloKur(): Promise<void> {
  if (tabloHazir) return;
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "Visit" (
       "id" TEXT NOT NULL PRIMARY KEY,
       "gun" TEXT NOT NULL,
       "ziyaretciHash" TEXT NOT NULL,
       "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Visit_gun_ziyaretciHash_key"
       ON "Visit" ("gun", "ziyaretciHash")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Visit_gun_idx" ON "Visit" ("gun")`
  );
  tabloHazir = true;
}

function istemciIp(h: Headers): string {
  const xff = (h.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const adaylar = [
    h.get("x-real-ip"),
    xff[xff.length - 1],
    h.get("cf-connecting-ip"),
    h.get("x-client-ip"),
  ];
  for (const a of adaylar) {
    const ip = (a ?? "").trim();
    if (ip) return ip;
  }
  return "";
}

async function ziyaretYaz(gun: string, ozet: string): Promise<void> {
  try {
    await tabloKur();
    await prisma.$executeRaw`
      INSERT OR IGNORE INTO "Visit" ("id", "gun", "ziyaretciHash", "createdAt")
      VALUES (${randomUUID()}, ${gun}, ${ozet}, ${new Date()})
    `;

    // Günde bir kez eski kayıtları temizle.
    if (temizlikGunu !== gun) {
      temizlikGunu = gun;
      const eski = gunKaydir(gun, -SAKLAMA_GUN);
      await prisma.$executeRaw`DELETE FROM "Visit" WHERE "gun" < ${eski}`;
    }
  } catch (e) {
    // Sayaç yüzünden sayfa açılmasın.
    console.error("ziyaret sayacı:", e);
  }
}

/**
 * Public sayfalarda çağrılır. Hata olsa bile sayfayı bozmaz.
 * Botları ve IP'si okunamayan istekleri saymaz.
 *
 * Yazma işi `after()` ile yanıt gönderildikten sonraya bırakılır:
 * SQLite yazması sayfanın ilk baytını geciktirmesin.
 */
export async function kaydetZiyaret(): Promise<void> {
  try {
    const h = await headers();
    const ua = h.get("user-agent") ?? "";
    if (!ua || BOT_KALIBI.test(ua)) return;

    const ip = istemciIp(h);
    if (!ip) return;

    const gun = istanbulGunu();
    const ay = gun.slice(0, 7);
    const tuz = `${process.env.AUTH_SECRET ?? "varsayilan"}:${ay}`;
    const ozet = createHash("sha256").update(`${ip}|${ua}|${tuz}`).digest("hex");

    after(() => ziyaretYaz(gun, ozet));
    // Günde bir kez iletişim mesajı saklama süresini de uygula.
    after(() => mesajTemizligi());
  } catch (e) {
    // Sayaç yüzünden sayfa açılmasın.
    console.error("ziyaret sayacı:", e);
  }
}

export type ZiyaretOzeti = { bugun: number; hafta: number; ay: number };

function sayi(rows: { sayi: bigint | number }[]): number {
  return Number(rows[0]?.sayi ?? 0);
}

/** Panelde gösterilecek özet: bugün / son 7 gün / bu ay tekil ziyaretçi. */
export async function ziyaretOzeti(): Promise<ZiyaretOzeti> {
  try {
    await tabloKur();
    const gun = istanbulGunu();
    const yediGunOnce = gunKaydir(gun, -6);
    const ayBasi = `${gun.slice(0, 7)}-01`;

    const [bugun, hafta, ay] = await Promise.all([
      prisma.$queryRaw<{ sayi: bigint | number }[]>`
        SELECT COUNT(*) AS sayi FROM "Visit" WHERE "gun" = ${gun}
      `,
      prisma.$queryRaw<{ sayi: bigint | number }[]>`
        SELECT COUNT(DISTINCT "ziyaretciHash") AS sayi
        FROM "Visit" WHERE "gun" >= ${yediGunOnce}
      `,
      prisma.$queryRaw<{ sayi: bigint | number }[]>`
        SELECT COUNT(DISTINCT "ziyaretciHash") AS sayi
        FROM "Visit" WHERE "gun" >= ${ayBasi}
      `,
    ]);

    return { bugun: sayi(bugun), hafta: sayi(hafta), ay: sayi(ay) };
  } catch (e) {
    console.error("ziyaret özeti:", e);
    return { bugun: 0, hafta: 0, ay: 0 };
  }
}

/** Ziyaret kartını yalnızca site sahibi görsün. */
export function sahipMi(email: string | null | undefined): boolean {
  return SAHIP_EPOSTALAR.includes((email ?? "").trim().toLowerCase());
}
