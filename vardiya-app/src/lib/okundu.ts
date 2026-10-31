/**
 * Okundu bilgisi — **saf kurallar** (veritabanı yok).
 *
 * Neden ayrı dosya: aynı özet/etiket mantığı hem personel bağlantısında
 * (`/ekip/<token>`) hem panelde hem sunucu uçlarında gerekiyor. Burada
 * tutulduğu için birim testleri veritabanı olmadan çalışır.
 *
 * Ürün kararı (31 Eki 2026): yalnızca **"gördü / görmedi"** tutulur.
 * Konum, cihaz, IP veya okuma süresi **saklanmaz** — amaç "mesajı gördün mü?"
 * sorusunu bitirmek, personeli izlemek değil.
 */

/** Okunabilir hedefler: yayınlanmış haftalık plan ve duyurular. */
export const OKUNDU_TURLERI = ["plan", "duyuru"] as const;
export type OkunduTuru = (typeof OKUNDU_TURLERI)[number];

export const OKUNDU_TUR_ETIKETI: Record<OkunduTuru, string> = {
  plan: "Haftalık plan",
  duyuru: "Duyuru",
};

/** Tek istekte işaretlenebilecek azami kayıt (personel sayfası 1–4 gönderir). */
export const AZAMI_OKUNDU_KAYDI = 10;

const ISO_DESENI = /^\d{4}-\d{2}-\d{2}$/;
/** Duyuru kimliği: cuid/uuid benzeri güvenli karakterler. */
const HEDEF_DESENI = /^[A-Za-z0-9_-]{1,64}$/;

export function okunduTuruGecerliMi(tur: unknown): tur is OkunduTuru {
  return (
    typeof tur === "string" &&
    (OKUNDU_TURLERI as readonly string[]).includes(tur)
  );
}

/**
 * Hedef kimliği türe göre doğrular.
 * - `plan` → haftanın pazartesi günü ("YYYY-MM-DD")
 * - `duyuru` → duyuru kimliği
 */
export function okunduHedefiGecerliMi(
  tur: OkunduTuru,
  hedefId: unknown,
): boolean {
  const deger = String(hedefId ?? "");
  if (!deger) return false;
  return tur === "plan" ? ISO_DESENI.test(deger) : HEDEF_DESENI.test(deger);
}

/** Tek bir hedefin okunma özeti. */
export type OkunduOzeti = {
  /** Kime gösterileceği: işletmenin aktif personel sayısı. */
  toplam: number;
  /** Bunlardan kaçı gördü. */
  goren: number;
  /** Görmeyen personel kimlikleri. */
  gormeyen: string[];
  /** Herkes gördü mü? (personel yoksa false) */
  tam: boolean;
  /** Yüzde (0–100), panelde ilerleme çubuğu için. */
  oran: number;
};

/**
 * "Kim gördü?" özeti.
 *
 * `gorenler` içinde bu işletmeye ait olmayan (ör. silinmiş personel) kimlikler
 * varsa sayılmaz; böylece panelde 3/2 gibi imkânsız bir oran çıkmaz.
 */
export function okunduOzeti(
  hepsi: readonly string[],
  gorenler: readonly string[],
): OkunduOzeti {
  const kume = new Set(hepsi);
  const gorenKume = new Set(gorenler.filter((id) => kume.has(id)));
  const gormeyen = hepsi.filter((id) => !gorenKume.has(id));
  const toplam = hepsi.length;
  const goren = toplam - gormeyen.length;
  return {
    toplam,
    goren,
    gormeyen,
    tam: toplam > 0 && gormeyen.length === 0,
    oran: toplam === 0 ? 0 : Math.round((goren / toplam) * 100),
  };
}

/** Panelde tek satırlık özet cümlesi. */
export function okunduCumlesi(ozet: OkunduOzeti): string {
  if (ozet.toplam === 0) return "Henüz personel yok";
  if (ozet.goren === 0) return `Henüz kimse görmedi (0/${ozet.toplam})`;
  if (ozet.tam) return `Herkes gördü (${ozet.toplam}/${ozet.toplam})`;
  return `${ozet.goren}/${ozet.toplam} kişi gördü`;
}

/** Panel kartı için hazır yanıt (adlar çözülmüş hâlde). */
export type OkunduKart = {
  toplam: number;
  goren: number;
  oran: number;
  /** Görmeyenlerin adları — panelde "Henüz görmeyenler: …" satırı için. */
  gormeyenAdlar: string[];
};

export type OkunduYaniti = {
  /** Hangi hafta için soruldu ("YYYY-MM-DD"). */
  hafta: string;
  /** Hafta yayında mı? Taslak haftada okundu bilgisi anlamsızdır. */
  yayinda: boolean;
  plan: OkunduKart;
  duyurular: {
    id: string;
    message: string;
    createdAt: string;
    ozet: OkunduKart;
  }[];
};
