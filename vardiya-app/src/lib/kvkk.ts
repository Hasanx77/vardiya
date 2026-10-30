import { createHash } from "crypto";
import { prisma } from "./prisma";
import { authSecret } from "./sir";

/**
 * KVKK — aydınlatma onayının **kanıtı**.
 *
 * Neden ayrı tablo: yayındaki şemaya kolon eklemek migration gerektiriyor.
 * Onay kaydı üç alanlık küçük bir tabloda tutulur ve tablo ilk kullanımda ham
 * SQL ile oluşturulur (Visit / Message / EmployeeLink tablolarındaki aynı yol).
 *
 * İlkeler:
 *   - **Fail-open:** onay yazılamazsa kayıt engellenmez (altyapı arızası
 *     yüzünden kimse hesap açamaz kalmasın); hata günlüğe yazılır.
 *   - **Veri minimizasyonu:** IP adresi ham saklanmaz. Yalnızca günlük tuzlu
 *     SHA-256 özeti tutulur; aynı gün aynı IP'yi eşleştirmeye yarar, kişiyi
 *     geri tanımlamaya yetmez. 12 ay sonra silinir.
 *   - **Sürüm:** metin değişirse sürüm değişir; eski onay yeni metni kapsamaz.
 */

/** Aydınlatma metninin sürümü. Metin her değiştiğinde burayı güncelle. */
export const AYDINLATMA_SURUMU = "2026-10-30";

const TABLO = "KvkkOnay";
const TEMIZLIK_ARALIGI_MS = 24 * 60 * 60 * 1000;
/** Onay kaydının saklama süresi: 12 ay (ispat yükü için makul asgari). */
const SAKLAMA_GUN = 365;

let tabloHazir = false;
let sonTemizlik = 0;

async function tabloyuHazirla() {
  if (tabloHazir) return;
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "KvkkOnay" (
       "id" TEXT NOT NULL PRIMARY KEY,
       "userId" TEXT NOT NULL,
       "surum" TEXT NOT NULL,
       "zaman" TEXT NOT NULL,
       "ipOzet" TEXT
     )`
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "KvkkOnay_user_surum" ON "KvkkOnay" ("userId", "surum")`
  );
  tabloHazir = true;
}

/** Günlük tuzlu IP özeti — ham IP hiçbir yerde durmaz. */
function ipOzeti(ip: string): string | null {
  const temiz = ip.trim();
  if (!temiz) return null;
  const gun = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${gun}|kvkk|${temiz}|${authSecret()}`)
    .digest("hex")
    .slice(0, 32);
}

/** Süresi geçmiş onay kayıtlarını temizle (günde bir kez, en çok). */
async function eskiKayitlariTemizle() {
  const simdi = Date.now();
  if (simdi - sonTemizlik < TEMIZLIK_ARALIGI_MS) return;
  sonTemizlik = simdi;
  const sinir = new Date(simdi - SAKLAMA_GUN * 24 * 60 * 60 * 1000).toISOString();
  await prisma.$executeRawUnsafe(`DELETE FROM "${TABLO}" WHERE "zaman" < ?`, sinir);
}

/**
 * Aydınlatma onayını kaydet. Aynı kullanıcı + aynı sürüm için tek satır
 * tutulur (ikinci kez çağrılırsa sessizce geçilir).
 *
 * @returns yazıldıysa `true`; altyapı hatasında `false` (kayıt akışı durmaz).
 */
export async function aydinlatmaOnayiKaydet({
  userId,
  ip = "",
}: {
  userId: string;
  ip?: string;
}): Promise<boolean> {
  try {
    await tabloyuHazirla();
    await prisma.$executeRawUnsafe(
      `INSERT OR IGNORE INTO "${TABLO}" ("id", "userId", "surum", "zaman", "ipOzet")
       VALUES (?, ?, ?, ?, ?)`,
      `${userId}:${AYDINLATMA_SURUMU}`,
      userId,
      AYDINLATMA_SURUMU,
      new Date().toISOString(),
      ipOzeti(ip),
    );
    await eskiKayitlariTemizle();
    return true;
  } catch (e) {
    console.error("kvkk:onay-kaydi", e);
    return false;
  }
}

/** Kullanıcının onayladığı en güncel aydınlatma sürümü (yoksa null). */
export async function aydinlatmaOnayi(
  userId: string,
): Promise<{ surum: string; zaman: string } | null> {
  try {
    await tabloyuHazirla();
    const satirlar = await prisma.$queryRawUnsafe<{ surum: string; zaman: string }[]>(
      `SELECT "surum", "zaman" FROM "${TABLO}" WHERE "userId" = ? ORDER BY "zaman" DESC LIMIT 1`,
      userId,
    );
    return satirlar[0] ?? null;
  } catch (e) {
    console.error("kvkk:onay-okuma", e);
    return null;
  }
}
