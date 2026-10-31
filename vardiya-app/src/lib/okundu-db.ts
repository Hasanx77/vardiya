import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";
import {
  okunduHedefiGecerliMi,
  okunduTuruGecerliMi,
  type OkunduTuru,
} from "./okundu";

/**
 * Okundu bilgisi — **veritabanı katmanı**.
 *
 * Tablo şemada değil; ilk kullanımda ham SQL ile kurulur (Visit / Message /
 * EmployeeLink / KvkkOnay / IzinTalebi ile aynı yol). Böylece canlıda
 * `prisma migrate` beklemeden devreye girer.
 *
 * İlkeler:
 *   - **Yalnızca "gördü" kaydı:** konum, cihaz, IP, okuma süresi yok.
 *   - **Tekilleştirme:** aynı kişi aynı planı/duyuruyu kaç kez açarsa açsın
 *     tek satır (`UNIQUE(employeeId, tur, hedefId)`).
 *   - **Fail-open:** yazılamazsa plan görüntüleme engellenmez; hata günlüğe
 *     düşer ve panelde "görmedi" görünür (yanlış tarafa düşmek daha zararsız).
 *   - **Sahiplik:** her sorgu `businessId` ile sınırlanır.
 */

const TABLO = "Okundu";

let tabloHazir = false;

async function tabloyuHazirla(): Promise<void> {
  if (tabloHazir) return;
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "${TABLO}" (
       "id" TEXT NOT NULL PRIMARY KEY,
       "businessId" TEXT NOT NULL,
       "employeeId" TEXT NOT NULL,
       "tur" TEXT NOT NULL,
       "hedefId" TEXT NOT NULL,
       "zaman" TEXT NOT NULL
     )`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "${TABLO}_tekil_idx"
       ON "${TABLO}" ("employeeId", "tur", "hedefId")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "${TABLO}_hedef_idx"
       ON "${TABLO}" ("businessId", "tur", "hedefId")`,
  );
  tabloHazir = true;
}

/**
 * "Gördü" kaydı yazar. Aynı kişi/hedef için ikinci kez çağrılırsa
 * `INSERT OR IGNORE` ile sessizce geçer (idempotent).
 */
export async function okunduIsaretle(girdi: {
  businessId: string;
  employeeId: string;
  tur: string;
  hedefId: string;
}): Promise<boolean> {
  if (!okunduTuruGecerliMi(girdi.tur)) return false;
  if (!okunduHedefiGecerliMi(girdi.tur, girdi.hedefId)) return false;
  try {
    await tabloyuHazirla();
    await prisma.$executeRawUnsafe(
      `INSERT OR IGNORE INTO "${TABLO}"
         ("id", "businessId", "employeeId", "tur", "hedefId", "zaman")
       VALUES (?, ?, ?, ?, ?, ?)`,
      randomUUID(),
      girdi.businessId,
      girdi.employeeId,
      girdi.tur,
      girdi.hedefId,
      new Date().toISOString(),
    );
    return true;
  } catch (e) {
    console.error("okundu:isaretle", e);
    return false;
  }
}

/**
 * Birden çok hedef için gören personel kimlikleri (tek sorgu).
 * Panel kartı 1 hafta + son 3 duyuru sorar; hedef başına ayrı sorgu atmasın.
 */
export async function okunduGorenlerCoklu(
  businessId: string,
  tur: OkunduTuru,
  hedefIdler: readonly string[],
): Promise<Map<string, string[]>> {
  const harita = new Map<string, string[]>(
    hedefIdler.map((id) => [id, [] as string[]]),
  );
  if (hedefIdler.length === 0) return harita;

  try {
    await tabloyuHazirla();
    const yerTutucular = hedefIdler.map(() => "?").join(", ");
    const satirlar = await prisma.$queryRawUnsafe<
      { hedefId: string; employeeId: string }[]
    >(
      `SELECT "hedefId", "employeeId" FROM "${TABLO}"
        WHERE "businessId" = ? AND "tur" = ? AND "hedefId" IN (${yerTutucular})`,
      businessId,
      tur,
      ...hedefIdler,
    );
    for (const s of satirlar ?? []) {
      harita.get(s.hedefId)?.push(s.employeeId);
    }
    return harita;
  } catch (e) {
    console.error("okundu:gorenler", e);
    return harita;
  }
}

/** İşletmenin tüm okundu kayıtlarını sil (demo/sıfırlama). */
export async function okunduSil(businessId: string): Promise<number> {
  try {
    await tabloyuHazirla();
    const n = await prisma.$executeRawUnsafe(
      `DELETE FROM "${TABLO}" WHERE "businessId" = ?`,
      businessId,
    );
    return Number(n) || 0;
  } catch (e) {
    console.error("okundu:sil", e);
    return 0;
  }
}

/** Hesap silinirken personele bağlı okundu kayıtlarını temizle. */
export async function personelOkunduSil(
  employeeIds: string[],
): Promise<number> {
  if (employeeIds.length === 0) return 0;
  try {
    await tabloyuHazirla();
    const yerTutucular = employeeIds.map(() => "?").join(", ");
    const n = await prisma.$executeRawUnsafe(
      `DELETE FROM "${TABLO}" WHERE "employeeId" IN (${yerTutucular})`,
      ...employeeIds,
    );
    return Number(n) || 0;
  } catch (e) {
    console.error("okundu:hesap-temizligi", e);
    return 0;
  }
}
