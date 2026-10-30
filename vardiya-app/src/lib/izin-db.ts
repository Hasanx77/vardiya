import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";
import {
  izinAraligiGecerliMi,
  izinCakismasiVarMi,
  izinGunSayisi,
  izinTuruGecerliMi,
  tarihGecerliMi,
} from "./izin";
import type { IzinDurumu, IzinTalebi, IzinTuru } from "./types";

/**
 * İzin / mazeret talebi — **veritabanı katmanı**.
 *
 * Tablo şemada değil; ilk kullanımda ham SQL ile kurulur (Visit / Message /
 * EmployeeLink / KvkkOnay ile aynı yol). Böylece canlıda `prisma migrate`
 * beklemeden devreye girer.
 *
 * İlkeler:
 *   - **Okuma fail-open:** tablo kurulamazsa boş liste döner (panel çökmesin).
 *   - **Yazma fail-closed:** talep kaydedilemezse kullanıcıya açık hata döner;
 *     sessizce yutulan bir talep, personelin izninin kaybolması demek olurdu.
 *   - **Veri minimizasyonu:** yalnızca tarih aralığı, tür, serbest not ve karar
 *     tutulur. Sağlık raporu/belge istenmez; telefon/kimlik bu tabloya girmez.
 *   - **Sahiplik:** her sorgu `businessId` (veya `employeeId`) ile sınırlanır.
 */

const TABLO = "IzinTalebi";
const VARSAYILAN_LIMIT = 200;

let tabloHazir = false;

async function tabloyuHazirla(): Promise<void> {
  if (tabloHazir) return;
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "${TABLO}" (
       "id" TEXT NOT NULL PRIMARY KEY,
       "businessId" TEXT NOT NULL,
       "employeeId" TEXT NOT NULL,
       "baslangic" TEXT NOT NULL,
       "bitis" TEXT NOT NULL,
       "tur" TEXT NOT NULL,
       "not" TEXT NOT NULL DEFAULT '',
       "durum" TEXT NOT NULL DEFAULT 'bekliyor',
       "createdAt" TEXT NOT NULL,
       "kararAt" TEXT,
       "kararNot" TEXT NOT NULL DEFAULT ''
     )`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "${TABLO}_business_durum_idx" ON "${TABLO}" ("businessId", "durum")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "${TABLO}_employee_idx" ON "${TABLO}" ("employeeId", "baslangic")`,
  );
  tabloHazir = true;
}

type Satir = {
  id: string;
  employeeId: string;
  baslangic: string;
  bitis: string;
  tur: string;
  not: string | null;
  durum: string;
  createdAt: string;
  kararAt: string | null;
  kararNot: string | null;
};

function satiriCevir(s: Satir): IzinTalebi {
  return {
    id: s.id,
    employeeId: s.employeeId,
    baslangic: s.baslangic,
    bitis: s.bitis,
    tur: (izinTuruGecerliMi(s.tur) ? s.tur : "izin") as IzinTuru,
    not: s.not ?? "",
    durum: (s.durum as IzinDurumu) ?? "bekliyor",
    createdAt: s.createdAt,
    kararAt: s.kararAt ?? null,
    kararNot: s.kararNot ?? "",
  };
}

/** İşletmenin talepleri — en yeni önce. Hata hâlinde boş liste (fail-open). */
export async function izinTalepleri(
  businessId: string,
  limit: number = VARSAYILAN_LIMIT,
): Promise<IzinTalebi[]> {
  try {
    await tabloyuHazirla();
    const satirlar = await prisma.$queryRawUnsafe<Satir[]>(
      `SELECT "id", "employeeId", "baslangic", "bitis", "tur", "not",
              "durum", "createdAt", "kararAt", "kararNot"
         FROM "${TABLO}"
        WHERE "businessId" = ?
        ORDER BY "createdAt" DESC
        LIMIT ?`,
      businessId,
      Math.max(1, Math.min(VARSAYILAN_LIMIT, Math.floor(limit))),
    );
    return (satirlar ?? []).map(satiriCevir);
  } catch (e) {
    console.error("izin:listele", e);
    return [];
  }
}

/** Tek personelin kendi talepleri (personel bağlantısı için). */
export async function personelIzinTalepleri(
  employeeId: string,
  limit = 20,
): Promise<IzinTalebi[]> {
  try {
    await tabloyuHazirla();
    const satirlar = await prisma.$queryRawUnsafe<Satir[]>(
      `SELECT "id", "employeeId", "baslangic", "bitis", "tur", "not",
              "durum", "createdAt", "kararAt", "kararNot"
         FROM "${TABLO}"
        WHERE "employeeId" = ?
        ORDER BY "createdAt" DESC
        LIMIT ?`,
      employeeId,
      Math.max(1, Math.min(100, Math.floor(limit))),
    );
    return (satirlar ?? []).map(satiriCevir);
  } catch (e) {
    console.error("izin:personel-listele", e);
    return [];
  }
}

export type IzinOlusturmaSonucu =
  | { ok: true; talep: IzinTalebi }
  | { ok: false; hata: string };

/**
 * Yeni talep açar.
 *
 * - Aralık `izinAraligiGecerliMi` ile doğrulanır.
 * - Aynı personelin **bekleyen** talebiyle kesişen yeni talep reddedilir
 *   (aynı gün için üst üste talep yağmurunu önler).
 * - `durum` yalnızca patron elle eklerken `onaylandi` olabilir.
 */
export async function izinTalebiOlustur(girdi: {
  businessId: string;
  employeeId: string;
  baslangic: string;
  bitis: string;
  tur: string;
  not?: string;
  durum?: IzinDurumu;
  bugun?: string;
}): Promise<IzinOlusturmaSonucu> {
  const baslangic = String(girdi.baslangic ?? "").trim();
  const bitis = String(girdi.bitis ?? "").trim();
  const tur = String(girdi.tur ?? "izin").trim();
  const not = String(girdi.not ?? "").trim().slice(0, 500);

  if (!izinTuruGecerliMi(tur)) {
    return { ok: false, hata: "Geçersiz talep türü." };
  }
  const aralikHatasi = izinAraligiGecerliMi(
    { baslangic, bitis },
    girdi.bugun,
  );
  if (aralikHatasi) return { ok: false, hata: aralikHatasi };

  const durum: IzinDurumu =
    girdi.durum === "onaylandi" ? "onaylandi" : "bekliyor";

  try {
    await tabloyuHazirla();

    // Aynı personelin bekleyen talebiyle çakışma kontrolü.
    const bekleyenler = await prisma.$queryRawUnsafe<
      { id: string; baslangic: string; bitis: string }[]
    >(
      `SELECT "id", "baslangic", "bitis" FROM "${TABLO}"
        WHERE "employeeId" = ? AND "durum" = 'bekliyor'`,
      girdi.employeeId,
    );
    const cakisan = (bekleyenler ?? []).some((b) =>
      izinCakismasiVarMi(b.baslangic, b.bitis, baslangic, bitis),
    );
    if (cakisan) {
      return {
        ok: false,
        hata: "Bu tarihler için zaten onay bekleyen bir talebin var.",
      };
    }

    const talep: IzinTalebi = {
      id: randomUUID(),
      employeeId: girdi.employeeId,
      baslangic,
      bitis,
      tur: tur as IzinTuru,
      not,
      durum,
      createdAt: new Date().toISOString(),
      kararAt: durum === "onaylandi" ? new Date().toISOString() : null,
      kararNot: "",
    };

    await prisma.$executeRawUnsafe(
      `INSERT INTO "${TABLO}"
         ("id", "businessId", "employeeId", "baslangic", "bitis", "tur",
          "not", "durum", "createdAt", "kararAt", "kararNot")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      talep.id,
      girdi.businessId,
      talep.employeeId,
      talep.baslangic,
      talep.bitis,
      talep.tur,
      talep.not,
      talep.durum,
      talep.createdAt,
      talep.kararAt,
      talep.kararNot,
    );

    return { ok: true, talep };
  } catch (e) {
    console.error("izin:olustur", e);
    return {
      ok: false,
      hata: "Talep şu an kaydedilemedi. Lütfen biraz sonra tekrar dene.",
    };
  }
}

/**
 * Talebe karar ver (onayla / reddet / iptal et).
 *
 * 🔒 Yalnızca **bekleyen** talep değiştirilebilir ve yalnızca aynı işletmenin
 * talebi. Böylece başka bir hesabın talebi `id` bilinse bile değiştirilemez.
 */
export async function izinKarari(girdi: {
  id: string;
  businessId: string;
  durum: IzinDurumu;
  kararNot?: string;
}): Promise<boolean> {
  try {
    await tabloyuHazirla();
    const etkilenen = await prisma.$executeRawUnsafe(
      `UPDATE "${TABLO}"
          SET "durum" = ?, "kararAt" = ?, "kararNot" = ?
        WHERE "id" = ? AND "businessId" = ? AND "durum" = 'bekliyor'`,
      girdi.durum,
      new Date().toISOString(),
      String(girdi.kararNot ?? "").trim().slice(0, 500),
      girdi.id,
      girdi.businessId,
    );
    return Number(etkilenen) > 0;
  } catch (e) {
    console.error("izin:karar", e);
    return false;
  }
}

/**
 * Personelin **onaylı** izin günleri (ISO tarih kümesi).
 * Panelde hücre işareti ve "izinli güne vardiya atanmış" uyarısı için.
 */
export async function onayliIzinGunleri(
  businessId: string,
  baslangic: string,
  bitis: string,
): Promise<{ employeeId: string; gunler: string[] }[]> {
  if (!tarihGecerliMi(baslangic) || !tarihGecerliMi(bitis)) return [];
  try {
    await tabloyuHazirla();
    const satirlar = await prisma.$queryRawUnsafe<
      { employeeId: string; baslangic: string; bitis: string }[]
    >(
      `SELECT "employeeId", "baslangic", "bitis" FROM "${TABLO}"
        WHERE "businessId" = ? AND "durum" = 'onaylandi'
          AND "bitis" >= ? AND "baslangic" <= ?`,
      businessId,
      baslangic,
      bitis,
    );

    const harita = new Map<string, string[]>();
    for (const s of satirlar ?? []) {
      const gunler: string[] = [];
      const toplam = izinGunSayisi(s.baslangic, s.bitis);
      if (toplam === 0) continue;
      const [y, m, d] = s.baslangic.split("-").map(Number);
      for (let i = 0; i < toplam; i++) {
        const t = new Date(Date.UTC(y, m - 1, d + i));
        const iso = t.toISOString().slice(0, 10);
        if (iso >= baslangic && iso <= bitis) gunler.push(iso);
      }
      const mevcut = harita.get(s.employeeId) ?? [];
      harita.set(s.employeeId, [...mevcut, ...gunler]);
    }

    return [...harita.entries()].map(([employeeId, gunler]) => ({
      employeeId,
      gunler,
    }));
  } catch (e) {
    console.error("izin:onayli-gunler", e);
    return [];
  }
}

/** İşletmenin tüm taleplerini sil (demo/sıfırlama). */
export async function izinTalepleriniSil(businessId: string): Promise<number> {
  try {
    await tabloyuHazirla();
    const n = await prisma.$executeRawUnsafe(
      `DELETE FROM "${TABLO}" WHERE "businessId" = ?`,
      businessId,
    );
    return Number(n) || 0;
  } catch (e) {
    console.error("izin:sil", e);
    return 0;
  }
}

/** Hesap silinirken personele bağlı talepleri temizle (ham SQL tablo). */
export async function personelIzinleriniSil(
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
    console.error("izin:hesap-temizligi", e);
    return 0;
  }
}
