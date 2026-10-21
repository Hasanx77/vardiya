import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";

/**
 * İletişim formu mesajları.
 *
 * Tablo, canlı sunucuda `prisma generate`/migration gerektirmeden ham SQL ile
 * kurulur (ziyaret sayacındaki `visits.ts` ile aynı yaklaşım).
 * Mesajlar yalnızca site sahibinin gördüğü `/mesajlar` sayfasında listelenir.
 */

let tabloHazir = false;
/** İletişim mesajları en fazla 12 ay saklanır (gizlilik metniyle aynı). */
const MESAJ_SAKLAMA_GUN = 365;
let sonTemizlikGunu = "";

async function eskiMesajlariSil(): Promise<void> {
  const gun = new Date().toISOString().slice(0, 10);
  if (sonTemizlikGunu === gun) return;
  sonTemizlikGunu = gun;
  try {
    const sinir = new Date(Date.now() - MESAJ_SAKLAMA_GUN * 86_400_000);
    await prisma.$executeRaw`DELETE FROM "Message" WHERE "createdAt" < ${sinir}`;
  } catch (e) {
    // Temizlik hatası mesaj akışını bozmasın.
    console.error("mesaj temizliği:", e);
  }
}

async function tabloKur(): Promise<void> {
  if (tabloHazir) return;
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "Message" (
       "id" TEXT NOT NULL PRIMARY KEY,
       "ad" TEXT NOT NULL,
       "email" TEXT NOT NULL,
       "mesaj" TEXT NOT NULL,
       "okundu" INTEGER NOT NULL DEFAULT 0,
       "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Message_createdAt_idx" ON "Message" ("createdAt")`,
  );
  tabloHazir = true;
}

export type Mesaj = {
  id: string;
  ad: string;
  email: string;
  mesaj: string;
  okundu: boolean;
  createdAt: Date;
};

export async function mesajKaydet(girdi: {
  ad: string;
  email: string;
  mesaj: string;
}): Promise<void> {
  await tabloKur();
  await prisma.$executeRaw`
    INSERT INTO "Message" ("id", "ad", "email", "mesaj", "okundu", "createdAt")
    VALUES (${randomUUID()}, ${girdi.ad}, ${girdi.email}, ${girdi.mesaj}, 0, ${new Date()})
  `;
  await eskiMesajlariSil();
}

type Satir = {
  id: string;
  ad: string;
  email: string;
  mesaj: string;
  okundu: number | bigint;
  createdAt: Date | string;
};

/** En yeni mesajlar önce. */
export async function mesajlariGetir(limit = 100): Promise<Mesaj[]> {
  try {
    await tabloKur();
    await eskiMesajlariSil();
    const satirlar = await prisma.$queryRaw<Satir[]>`
      SELECT "id", "ad", "email", "mesaj", "okundu", "createdAt"
      FROM "Message"
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `;
    return satirlar.map((s) => ({
      ...s,
      okundu: Number(s.okundu) === 1,
      createdAt: s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt),
    }));
  } catch (e) {
    console.error("mesajlar:", e);
    return [];
  }
}

export async function mesajOzeti(): Promise<{ toplam: number; okunmamis: number }> {
  try {
    await tabloKur();
    await eskiMesajlariSil();
    const rows = await prisma.$queryRaw<{ toplam: bigint | number; okunmamis: bigint | number }[]>`
      SELECT COUNT(*) AS toplam,
             SUM(CASE WHEN "okundu" = 0 THEN 1 ELSE 0 END) AS okunmamis
      FROM "Message"
    `;
    return {
      toplam: Number(rows[0]?.toplam ?? 0),
      okunmamis: Number(rows[0]?.okunmamis ?? 0),
    };
  } catch (e) {
    console.error("mesaj özeti:", e);
    return { toplam: 0, okunmamis: 0 };
  }
}

export async function mesajlariOkunduYap(): Promise<void> {
  try {
    await tabloKur();
    await prisma.$executeRaw`UPDATE "Message" SET "okundu" = 1 WHERE "okundu" = 0`;
  } catch (e) {
    console.error("mesaj okundu:", e);
  }
}

/** Günlük bakım: süresi dolmuş iletişim mesajlarını temizler. */
export async function mesajTemizligi(): Promise<void> {
  try {
    await tabloKur();
    await eskiMesajlariSil();
  } catch (e) {
    console.error("mesaj bakımı:", e);
  }
}

/** Hesap silinirken o e-postayla gönderilmiş iletişim mesajlarını da siler. */
export async function mesajlariEpostaylaSil(email: string): Promise<void> {
  try {
    await tabloKur();
    await prisma.$executeRaw`DELETE FROM "Message" WHERE lower("email") = ${email.trim().toLowerCase()}`;
  } catch (e) {
    console.error("mesaj silme:", e);
  }
}

/** Veri indirmede kullanıcının kendi gönderdiği mesajlar. */
export async function mesajlariEpostaylaGetir(email: string): Promise<Mesaj[]> {
  try {
    await tabloKur();
    const satirlar = await prisma.$queryRaw<Satir[]>`
      SELECT "id", "ad", "email", "mesaj", "okundu", "createdAt"
      FROM "Message"
      WHERE lower("email") = ${email.trim().toLowerCase()}
      ORDER BY "createdAt" DESC
    `;
    return satirlar.map((s) => ({
      ...s,
      okundu: Number(s.okundu) === 1,
      createdAt: s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt),
    }));
  } catch (e) {
    console.error("mesaj indirme:", e);
    return [];
  }
}
