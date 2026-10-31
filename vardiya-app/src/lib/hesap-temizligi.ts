/**
 * Hesap silme sırasında **ham SQL ile kurulmuş** tabloların temizliği.
 *
 * Neden ayrı dosya: `IkiAdim`, `EmployeeLink`, `GirisDenemesi` Prisma modeli
 * değil (canlıya migration gerektirmeden eklenebilsin diye `CREATE TABLE IF NOT
 * EXISTS` ile kuruluyorlar). Bu yüzden `user.delete` cascade'i onlara dokunmaz:
 * - `IkiAdim` → TOTP sırrı ve yedek kod özetleri
 * - `EmployeeLink` → personel bağlantı sürümü (personel id'leri üzerinden)
 * - `GirisDenemesi` → e-posta adresi ve IP içeren sayaç anahtarları
 *
 * Kural: bu fonksiyon `prisma.user.delete` çağrısından **önce** çalışır; çünkü
 * personel id'leri silindikten sonra okunamaz.
 *
 * Hata yutulur: bir tablo kilitliyse hesap silme akışı durmasın (asıl veri
 * `cascade` ile zaten gider). Temizlik yarıda kalırsa günlüğe yazılır.
 */
import { prisma } from "./prisma";

export type SilinecekKullanici = { id: string; email: string };

export type TemizlikSonucu = {
  employeeLink: number;
  ikiAdim: number;
  girisDenemesi: number;
  /** İzin / mazeret talepleri (ham SQL tablo). */
  izin: number;
  /** Okundu (plan/duyuru görüldü) kayıtları — ham SQL tablo. */
  okundu: number;
};

/**
 * SQL `LIKE` jokerlerini kaçırır.
 * E-posta adresinde `_` veya `%` geçebilir; kaçırmazsak desen başka
 * kullanıcıların sayaçlarını da siler.
 */
export function likeKacir(metin: string): string {
  return String(metin ?? "").replace(/[\\%_]/g, (k) => `\\${k}`);
}

async function dene(etiket: string, is: () => Promise<unknown>): Promise<number> {
  try {
    const sonuc = await is();
    return Number(sonuc) || 0;
  } catch (e) {
    console.error(
      `hesap temizliği (${etiket}):`,
      e instanceof Error ? e.message : String(e),
    );
    return 0;
  }
}

/**
 * Kullanıcıya bağlı artık kayıtları siler ve silinen satır sayılarını döner.
 * Hiçbir hata fırlatmaz.
 */
export async function kullaniciArtiKayitlariSil(
  kullanici: SilinecekKullanici,
): Promise<TemizlikSonucu> {
  const sonuc: TemizlikSonucu = { employeeLink: 0, ikiAdim: 0, girisDenemesi: 0, izin: 0, okundu: 0 };

  // 1) Personel id'leri — hesap silinmeden önce toplanmalı.
  let personelIdleri: string[] = [];
  try {
    const satirlar = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT "id" FROM "Employee"
        WHERE "businessId" IN (SELECT "id" FROM "Business" WHERE "userId" = ?)`,
      kullanici.id,
    );
    personelIdleri = (satirlar ?? []).map((s) => s.id).filter(Boolean);
  } catch (e) {
    console.error(
      "hesap temizliği (personel listesi):",
      e instanceof Error ? e.message : String(e),
    );
  }

  // 2) Personel bağlantı sürümleri
  if (personelIdleri.length > 0) {
    const yerTutucular = personelIdleri.map(() => "?").join(", ");
    sonuc.employeeLink = await dene("EmployeeLink", () =>
      prisma.$executeRawUnsafe(
        `DELETE FROM "EmployeeLink" WHERE "employeeId" IN (${yerTutucular})`,
        ...personelIdleri,
      ),
    );
  }

  // 3) İzin / mazeret talepleri (ham SQL tablo; hesap silinince kişinin talepleri de gider)
  if (personelIdleri.length > 0) {
    const yerTutucular = personelIdleri.map(() => "?").join(", ");
    sonuc.izin = await dene("IzinTalebi", () =>
      prisma.$executeRawUnsafe(
        `DELETE FROM "IzinTalebi" WHERE "employeeId" IN (${yerTutucular})`,
        ...personelIdleri,
      ),
    );
  }

  // 3b) Okundu kayıtları (ham SQL tablo; "kim gördü" bilgisi de gider)
  if (personelIdleri.length > 0) {
    const yerTutucular = personelIdleri.map(() => "?").join(", ");
    sonuc.okundu = await dene("Okundu", () =>
      prisma.$executeRawUnsafe(
        `DELETE FROM "Okundu" WHERE "employeeId" IN (${yerTutucular})`,
        ...personelIdleri,
      ),
    );
  }

  // 4) TOTP sırrı
  sonuc.ikiAdim = await dene("IkiAdim", () =>
    prisma.$executeRawUnsafe(`DELETE FROM "IkiAdim" WHERE "userId" = ?`, kullanici.id),
  );

  // 5) Giriş/kayıt/sıfırlama sayaçları (e-posta ve kullanıcı id'si ile kurulur)
  const eposta = likeKacir(kullanici.email.trim().toLowerCase());
  sonuc.girisDenemesi = await dene("GirisDenemesi", () =>
    prisma.$executeRawUnsafe(
      `DELETE FROM "GirisDenemesi"
        WHERE "anahtar" LIKE ? ESCAPE '\\'
           OR "anahtar" LIKE ? ESCAPE '\\'
           OR "anahtar" IN (?, ?)`,
      `%|${eposta}`,
      `%:${eposta}`,
      `ikiadim:${kullanici.id}`,
      `ikiadim-ayar:${kullanici.id}`,
    ),
  );

  return sonuc;
}
