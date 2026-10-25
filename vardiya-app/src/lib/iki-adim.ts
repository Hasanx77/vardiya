/**
 * İki adımlı doğrulama (2FA) durumu.
 *
 * Tablo Prisma modeli yerine **ham SQL** ile kurulur: canlı sunucuda
 * `prisma migrate deploy` çalıştırmadan da güvenle çalışsın diye
 * (`Visit`, `Message`, `EmployeeLink` ile aynı desen).
 *
 * Saklananlar:
 *   - `secret`      : Base32 TOTP sırrı (yalnız sunucuda)
 *   - `aktif`       : kurulum tamamlandı mı? (0 → kullanıcı kodu doğrulamadı)
 *   - `yedekKodlar` : tek kullanımlık yedek kodların HMAC özetleri (virgüllü)
 *   - `sonAdim`     : en son kabul edilen 30 sn'lik adım (kod tekrarını engeller)
 *
 * ⚠️ Sır hiçbir zaman istemciye kalıcı olarak verilmez; yalnız kurulum
 * ekranında bir kez gösterilir.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";
import { authSecret } from "./sir";
import { adimNo, kodDogrula, otpauthAdresi, sirUret } from "./totp";

let tabloHazir = false;

async function tabloKur(): Promise<void> {
  if (tabloHazir) return;
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "IkiAdim" (
       "userId" TEXT NOT NULL PRIMARY KEY,
       "secret" TEXT NOT NULL,
       "aktif" INTEGER NOT NULL DEFAULT 0,
       "yedekKodlar" TEXT NOT NULL DEFAULT '',
       "sonAdim" INTEGER NOT NULL DEFAULT -1,
       "olusturma" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "guncelleme" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,
  );
  tabloHazir = true;
}

type Satir = {
  secret: string;
  aktif: bigint | number;
  yedekKodlar: string;
  sonAdim: bigint | number;
};

async function satirOku(userId: string): Promise<Satir | null> {
  await tabloKur();
  const satirlar = await prisma.$queryRaw<Satir[]>`
    SELECT "secret", "aktif", "yedekKodlar", "sonAdim" FROM "IkiAdim" WHERE "userId" = ${userId} LIMIT 1
  `;
  return satirlar[0] ?? null;
}

/** Yedek kod listesini (özetleri) diziye çevirir. */
function yedekListesi(metin: string): string[] {
  return (metin ?? "").split(",").filter(Boolean);
}

const YEDEK_ALFABE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // I, O, 0, 1 yok — okunabilirlik

/** 10 adet tek kullanımlık yedek kod (`XXXX-XXXX`). */
function yedekKodUret(adet = 10): string[] {
  const kodlar: string[] = [];
  for (let i = 0; i < adet; i++) {
    const ham = randomBytes(8);
    let kod = "";
    for (let j = 0; j < 8; j++) kod += YEDEK_ALFABE[ham[j] % YEDEK_ALFABE.length];
    kodlar.push(`${kod.slice(0, 4)}-${kod.slice(4)}`);
  }
  return kodlar;
}

/** Yedek kodun sunucudaki özeti (AUTH_SECRET ile HMAC → veritabanı sızsa da kod üretilemez). */
function yedekOzet(kod: string): string {
  return createHmac("sha256", authSecret())
    .update((kod || "").toUpperCase().replace(/[^A-Z0-9]/g, ""))
    .digest("hex");
}

function ozetEsitMi(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

export type IkiAdimDurum = { aktif: boolean; yedekKalan: number; kurulumVar: boolean };

export async function ikiAdimDurumu(userId: string): Promise<IkiAdimDurum> {
  try {
    const satir = await satirOku(userId);
    if (!satir) return { aktif: false, yedekKalan: 0, kurulumVar: false };
    return {
      aktif: Number(satir.aktif) === 1,
      yedekKalan: yedekListesi(satir.yedekKodlar).length,
      kurulumVar: true,
    };
  } catch (e) {
    console.error("2FA durumu okunamadı:", e);
    return { aktif: false, yedekKalan: 0, kurulumVar: false };
  }
}

/**
 * Kurulumu başlatır: yeni sır üretir, **pasif** olarak saklar ve
 * authenticator uygulamasına girilecek bilgileri döner.
 */
export async function kurulumBaslat(
  userId: string,
  eposta: string,
): Promise<{ sir: string; adres: string }> {
  await tabloKur();
  const sir = sirUret();
  await prisma.$executeRaw`
    INSERT INTO "IkiAdim" ("userId", "secret", "aktif", "yedekKodlar", "sonAdim", "olusturma", "guncelleme")
    VALUES (${userId}, ${sir}, 0, '', -1, ${new Date()}, ${new Date()})
    ON CONFLICT("userId") DO UPDATE SET
      "secret" = excluded."secret",
      "aktif" = 0,
      "yedekKodlar" = '',
      "sonAdim" = -1,
      "guncelleme" = excluded."guncelleme"
  `;
  return { sir, adres: otpauthAdresi(eposta, sir) };
}

/**
 * Kullanıcı kodu doğru girdiyse 2FA'yı etkinleştirir ve yedek kodları
 * **bir kez** döner (veritabanında yalnız özetleri kalır).
 */
export async function etkinlestir(userId: string, kod: string): Promise<string[] | null> {
  const satir = await satirOku(userId);
  if (!satir || Number(satir.aktif) === 1) return null;

  const adim = kodDogrula(satir.secret, kod, { sonAdim: Number(satir.sonAdim) });
  if (adim === null) return null;

  const kodlar = yedekKodUret();
  await prisma.$executeRaw`
    UPDATE "IkiAdim"
       SET "aktif" = 1,
           "yedekKodlar" = ${kodlar.map(yedekOzet).join(",")},
           "sonAdim" = ${adim},
           "guncelleme" = ${new Date()}
     WHERE "userId" = ${userId}
  `;
  return kodlar;
}

/** 2FA'yı kapatır (satır silinir). */
export async function kapat(userId: string): Promise<void> {
  await tabloKur();
  await prisma.$executeRaw`DELETE FROM "IkiAdim" WHERE "userId" = ${userId}`;
}

/** Yedek kodları yeniler (eski kodlar geçersiz olur). */
export async function yedekYenile(userId: string): Promise<string[] | null> {
  const satir = await satirOku(userId);
  if (!satir || Number(satir.aktif) !== 1) return null;
  const kodlar = yedekKodUret();
  await prisma.$executeRaw`
    UPDATE "IkiAdim"
       SET "yedekKodlar" = ${kodlar.map(yedekOzet).join(",")},
           "guncelleme" = ${new Date()}
     WHERE "userId" = ${userId}
  `;
  return kodlar;
}

export type DogrulamaSonuc = "totp" | "yedek";

/**
 * Giriş sırasında kodu doğrular.
 * Önce 6 haneli TOTP, olmazsa yedek kod. Yedek kod **tek kullanımlıktır**.
 */
export async function kodDogrulaKullanici(
  userId: string,
  kod: string,
): Promise<DogrulamaSonuc | null> {
  const satir = await satirOku(userId);
  if (!satir || Number(satir.aktif) !== 1) return null;

  const sonAdim = Number(satir.sonAdim);
  const adim = kodDogrula(satir.secret, kod, { sonAdim });
  if (adim !== null) {
    await prisma.$executeRaw`
      UPDATE "IkiAdim" SET "sonAdim" = ${adim}, "guncelleme" = ${new Date()}
       WHERE "userId" = ${userId}
    `;
    return "totp";
  }

  const gelen = yedekOzet(kod);
  if (gelen.length !== 64) return null;
  const liste = yedekListesi(satir.yedekKodlar);
  const kalan = liste.filter((ozet) => !ozetEsitMi(ozet, gelen));
  if (kalan.length === liste.length) return null;

  await prisma.$executeRaw`
    UPDATE "IkiAdim" SET "yedekKodlar" = ${kalan.join(",")}, "guncelleme" = ${new Date()}
     WHERE "userId" = ${userId}
  `;
  return "yedek";
}

/** 2FA aktif mi? (giriş akışı için hızlı kontrol) */
export async function ikiAdimAktifMi(userId: string): Promise<boolean> {
  try {
    const satir = await satirOku(userId);
    return Boolean(satir && Number(satir.aktif) === 1);
  } catch (e) {
    // Veritabanı okunamazsa güvenli tarafta kal: 2FA istemiyoruz demek,
    // girişi tamamen kilitlemekten daha az zararlı (2FA zorunlu değil).
    console.error("2FA kontrolü:", e);
    return false;
  }
}

/** Test/teşhis için: şu anki adım numarası. */
export { adimNo };
