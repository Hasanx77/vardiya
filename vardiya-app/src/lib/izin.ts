/**
 * İzin / mazeret talebi — **saf kurallar** (veritabanı yok).
 *
 * Neden ayrı dosya: aynı doğrulama ve etiketler hem personel bağlantısında
 * (`/ekip/<token>`) hem panelde hem sunucu uçlarında gerekiyor. Burada
 * tutulduğu için birim testleri veritabanı olmadan çalışır.
 *
 * Ürün kararı (30 Eki 2026): talep **personelden** gelir, patron onaylar.
 * "Rapor" türünde belge istenmez; sağlık detayı toplanmaz — not alanı
 * isteğe bağlı ve serbest metindir (veri minimizasyonu).
 */
import { gunEkleISO, istanbulGunu } from "./dates";
import { MONTH_SHORT_TR } from "./dates";
import type { IzinDurumu, IzinTalebi, IzinTuru } from "./types";

export const IZIN_TURLERI: readonly IzinTuru[] = [
  "izin",
  "mazeret",
  "rapor",
  "degisim",
];

export const IZIN_DURUMLARI: readonly IzinDurumu[] = [
  "bekliyor",
  "onaylandi",
  "reddedildi",
  "iptal",
];

export const IZIN_TUR_ETIKETI: Record<IzinTuru, string> = {
  izin: "İzin",
  mazeret: "Mazeret",
  rapor: "Rapor",
  degisim: "Vardiya değişimi",
};

export const IZIN_DURUM_ETIKETI: Record<IzinDurumu, string> = {
  bekliyor: "Onay bekliyor",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
  iptal: "İptal edildi",
};

/** Tek bir talebin azami uzunluğu (gün). Daha uzunu elle yönetilmeli. */
export const AZAMI_IZIN_GUN = 60;
/** Geçmişe dönük talep penceresi (gün) — "dün rapor aldım" durumu için. */
export const GERIYE_IZIN_GUN = 90;
/** İleriye dönük talep penceresi (gün). */
export const ILERIYE_IZIN_GUN = 365;

const ISO_DESENI = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" geçerli bir takvim günü mü? (2026-02-31 gibi taşmalar elenir) */
export function tarihGecerliMi(iso: string): boolean {
  if (!ISO_DESENI.test(String(iso ?? ""))) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  if (Number.isNaN(t.getTime())) return false;
  return t.toISOString().slice(0, 10) === iso;
}

export function izinTuruGecerliMi(deger: string): deger is IzinTuru {
  return (IZIN_TURLERI as readonly string[]).includes(deger);
}

export function izinDurumuGecerliMi(deger: string): deger is IzinDurumu {
  return (IZIN_DURUMLARI as readonly string[]).includes(deger);
}

/** Aralığın kapsadığı gün sayısı (başlangıç ve bitiş dahil). Geçersizse 0. */
export function izinGunSayisi(baslangic: string, bitis: string): number {
  if (!tarihGecerliMi(baslangic) || !tarihGecerliMi(bitis)) return 0;
  if (bitis < baslangic) return 0;
  const [ay, am, ad] = baslangic.split("-").map(Number);
  const [by, bm, bd] = bitis.split("-").map(Number);
  const fark =
    (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000;
  return Math.round(fark) + 1;
}

/** `iso` günü [baslangic, bitis] aralığında mı? */
export function tarihAraligiKapsar(
  baslangic: string,
  bitis: string,
  iso: string,
): boolean {
  if (!tarihGecerliMi(baslangic) || !tarihGecerliMi(bitis)) return false;
  return iso >= baslangic && iso <= bitis;
}

/** İki tarih aralığı kesişiyor mu? */
export function izinCakismasiVarMi(
  a1: string,
  b1: string,
  a2: string,
  b2: string,
): boolean {
  if (![a1, b1, a2, b2].every(tarihGecerliMi)) return false;
  return a1 <= b2 && a2 <= b1;
}

/**
 * Talep aralığını doğrular. Sorun yoksa `null`, varsa **kullanıcıya
 * gösterilecek** Türkçe hata metni döner.
 *
 * @param bugun Test edilebilirlik için; varsayılan Türkiye saatiyle bugün.
 */
export function izinAraligiGecerliMi(
  girdi: { baslangic: string; bitis: string },
  bugun: string = istanbulGunu(),
): string | null {
  const baslangic = String(girdi.baslangic ?? "").trim();
  const bitis = String(girdi.bitis ?? "").trim();

  if (!tarihGecerliMi(baslangic) || !tarihGecerliMi(bitis)) {
    return "Başlangıç ve bitiş tarihini seç.";
  }
  if (bitis < baslangic) {
    return "Bitiş tarihi başlangıçtan önce olamaz.";
  }

  const gun = izinGunSayisi(baslangic, bitis);
  if (gun > AZAMI_IZIN_GUN) {
    return `Tek talepte en fazla ${AZAMI_IZIN_GUN} gün olabilir.`;
  }

  const enErken = gunEkleISO(bugun, -GERIYE_IZIN_GUN);
  const enGec = gunEkleISO(bugun, ILERIYE_IZIN_GUN);
  if (bitis < enErken) {
    return `Geçmişe dönük en fazla ${GERIYE_IZIN_GUN} gün için talep açılabilir.`;
  }
  if (baslangic > enGec) {
    return `En fazla ${ILERIYE_IZIN_GUN} gün sonrası için talep açılabilir.`;
  }

  return null;
}

function isoToDate(iso: string): Date | null {
  if (!tarihGecerliMi(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** "12 Kas" / "12–14 Kas 2026" / "30 Eki – 3 Kas 2026" biçiminde okunur aralık. */
export function izinTarihMetni(baslangic: string, bitis: string): string {
  const a = isoToDate(baslangic);
  const b = isoToDate(bitis);
  if (!a || !b) return "—";

  const aYil = a.getUTCFullYear();
  const bYil = b.getUTCFullYear();
  const aAy = a.getUTCMonth();
  const bAy = b.getUTCMonth();

  if (baslangic === bitis) {
    return `${a.getUTCDate()} ${MONTH_SHORT_TR[aAy]} ${aYil}`;
  }
  if (aYil === bYil && aAy === bAy) {
    return `${a.getUTCDate()}–${b.getUTCDate()} ${MONTH_SHORT_TR[bAy]} ${bYil}`;
  }
  if (aYil === bYil) {
    return `${a.getUTCDate()} ${MONTH_SHORT_TR[aAy]} – ${b.getUTCDate()} ${
      MONTH_SHORT_TR[bAy]
    } ${bYil}`;
  }
  return `${a.getUTCDate()} ${MONTH_SHORT_TR[aAy]} ${aYil} – ${b.getUTCDate()} ${
    MONTH_SHORT_TR[bAy]
  } ${bYil}`;
}

/** Yalnızca onay bekleyenler (panelde "Onay bekleyen" kartı). */
export function bekleyenTalepler(
  talepler: readonly IzinTalebi[],
): IzinTalebi[] {
  return talepler.filter((t) => t.durum === "bekliyor");
}

/**
 * Personelin o gün **onaylı** izni var mı?
 * Panelde hücreye "İzinli" işareti koymak ve izinli güne vardiya atanmışsa
 * uyarı üretmek için kullanılır.
 */
export function onayliIzinVarMi(
  talepler: readonly IzinTalebi[],
  employeeId: string,
  iso: string,
): boolean {
  return talepler.some(
    (t) =>
      t.employeeId === employeeId &&
      t.durum === "onaylandi" &&
      tarihAraligiKapsar(t.baslangic, t.bitis, iso),
  );
}

/** Panelde gösterilecek kısa özet: "3 talep · 2 onay bekliyor". */
export function izinOzeti(talepler: readonly IzinTalebi[]): {
  toplam: number;
  bekleyen: number;
  onayli: number;
} {
  return {
    toplam: talepler.length,
    bekleyen: talepler.filter((t) => t.durum === "bekliyor").length,
    onayli: talepler.filter((t) => t.durum === "onaylandi").length,
  };
}
