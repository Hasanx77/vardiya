import { join, isAbsolute } from "node:path";
import { prisma } from "./prisma";

/**
 * SQLite bakımı — **bir kez** çalışır.
 *
 * Neden: canlı günlükte "database is locked" hataları görüldü. WAL modu
 * okuyucuların yazma sırasında bloklanmasını engeller; `busy_timeout` ise
 * kısa kilitlerde hemen hata vermek yerine bekler. Ayrıca sık kullanılan
 * sorgular için indeksler eklenir.
 *
 * Tüm adımlar **fail-open**: biri başarısız olursa uygulama normal çalışmaya
 * devam eder, yalnızca günlüğe yazılır.
 */

let calisti = false;

/** `DATABASE_URL` → gerçek dosya yolu (Prisma göreli yolu `prisma/` altında çözer). */
export function activeDbPath(): string {
  const ham = (process.env.DATABASE_URL ?? "file:./dev.db").trim();
  const yol = ham.startsWith("file:") ? ham.slice(5) : ham;
  if (isAbsolute(yol)) return yol;
  return join(process.cwd(), "prisma", yol);
}

export async function veritabaniBakimi(): Promise<void> {
  if (calisti) return;
  calisti = true;

  // ⚠️ WAL yalnızca **üretimde**: geliştirmede Turbopack dosya izleyicisi
  // `dev.db-shm`'i kilitli okumaya çalışıp çöküyor (os error 33).
  if (process.env.NODE_ENV === "production") {
    try {
      await prisma.$queryRawUnsafe("PRAGMA journal_mode=WAL");
    } catch (e) {
      console.error("db-bakim: WAL kurulamadı:", e instanceof Error ? e.message : e);
    }
  }

  try {
    await prisma.$queryRawUnsafe("PRAGMA busy_timeout=5000");
  } catch {
    /* sürücü desteklemiyorsa geç */
  }

  // Sık kullanılan sorgular: işletme + tarih aralığı, takvim/rapor taramaları.
  const indeksler = [
    `CREATE INDEX IF NOT EXISTS "Assignment_business_date_idx" ON "Assignment" ("businessId","date")`,
    `CREATE INDEX IF NOT EXISTS "Assignment_date_idx" ON "Assignment" ("date")`,
    `CREATE INDEX IF NOT EXISTS "Employee_business_idx" ON "Employee" ("businessId","active")`,
    `CREATE INDEX IF NOT EXISTS "Announcement_business_idx" ON "Announcement" ("businessId","createdAt")`,
  ];
  for (const sql of indeksler) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (e) {
      console.error("db-bakim: indeks:", e instanceof Error ? e.message : e);
    }
  }
}
