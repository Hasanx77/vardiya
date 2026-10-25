/**
 * SQLite bakım betiği — VACUUM + PRAGMA optimize.
 *
 * Neden elle: `VACUUM` veritabanını kilitler ve dosyayı yeniden yazar. Paylaşımlı
 * sunucuda uygulama çalışırken tetiklenirse istekler kilitlenir. Bu yüzden
 * otomatik çalışmaz; **uygulama durdurulduktan sonra** elle çalıştırılır.
 *
 * Ne yapar:
 *   1. `PRAGMA integrity_check` → bozulma var mı?
 *   2. `VACUUM`                → silinen satırların disk artığını temizler
 *                                (hesap silindikten sonra e-posta adresleri
 *                                 dosyanın boş sayfalarında kalabiliyor)
 *   3. `PRAGMA optimize`       → sorgu planlayıcı istatistiklerini tazeler
 *
 * Kullanım (yerel):
 *   node scripts/vacuum.mjs
 * Kullanım (sunucu — ÖNCE uygulamayı durdurun):
 *   cd vardiya-app && node scripts/vacuum.mjs
 *
 * Yedek almadan çalıştırmayın: `cp prisma/dev.db prisma/dev.db.bak-vacuum`
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function sure(ms) {
  return `${(ms / 1000).toFixed(1)} sn`;
}

async function main() {
  const basladi = Date.now();

  const butunluk = await prisma.$queryRawUnsafe("PRAGMA integrity_check");
  const durum = Array.isArray(butunluk) ? butunluk[0]?.integrity_check : butunluk;
  console.log(`integrity_check: ${durum}`);

  if (String(durum).toLowerCase() !== "ok") {
    console.error("Veritabanı bütünlük kontrolü başarısız — VACUUM çalıştırılmadı.");
    process.exitCode = 1;
    return;
  }

  await prisma.$executeRawUnsafe("VACUUM");
  console.log("VACUUM tamamlandı.");

  await prisma.$executeRawUnsafe("PRAGMA optimize");
  console.log("PRAGMA optimize tamamlandı.");

  console.log(`Toplam süre: ${sure(Date.now() - basladi)}`);
}

main()
  .catch((e) => {
    console.error("Bakım hatası:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
