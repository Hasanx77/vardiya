/**
 * Personel listesi içe aktarma yardımcıları.
 *
 * Desteklenen biçimler:
 *   • Excel'den kopyala-yapıştır (sekmeyle ayrılmış satırlar)
 *   • CSV (virgül veya noktalı virgül; tırnaklı alanlar dahil)
 *   • Düz metin (her satırda bir kişi)
 *
 * Beklenen sütunlar: Ad Soyad ; Görev ; Telefon
 * Görev ve telefon isteğe bağlıdır. Başlık satırı ("Ad;Görev;Telefon")
 * otomatik olarak atlanır; böylece Excel dosyasını olduğu gibi yapıştırmak yeterlidir.
 */

export type ParsedEmployee = { name: string; role: string; phone: string };

const BASLIK_AD = [
  "ad",
  "ad soyad",
  "adi",
  "adı",
  "isim",
  "isim soyad",
  "personel",
  "personel adi",
  "personel adı",
  "name",
  "full name",
  "employee",
  "employee name",
];

const BASLIK_GOREV = [
  "gorev",
  "görev",
  "rol",
  "pozisyon",
  "unvan",
  "ünvan",
  "role",
  "position",
  "title",
];

const BASLIK_TELEFON = [
  "telefon",
  "tel",
  "gsm",
  "cep",
  "cep telefonu",
  "phone",
  "mobile",
];

/** Karşılaştırma için metni sadeleştirir (büyük/küçük harf, fazla boşluk). */
function sadeles(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

/** İlk satırın başlık olup olmadığını anlar. */
export function baslikSatiriMi(satir: string, ayirici: string): boolean {
  const hucreler = satir.split(ayirici).map(sadeles);
  const adVar = hucreler.some((h) => BASLIK_AD.includes(h));
  const gorevVar = hucreler.some((h) => BASLIK_GOREV.includes(h));
  const telefonVar = hucreler.some((h) => BASLIK_TELEFON.includes(h));
  // Yalnızca "Ad" hücresi de yeterli; ancak tek sütunlu "Ad" satırı
  // gerçek bir personel adı olabileceği için iki sinyal arıyoruz.
  return adVar && (gorevVar || telefonVar || hucreler.length >= 2);
}

/**
 * Bir satırı ayırıcıya göre hücrelere böler.
 * Çift tırnak içindeki ayırıcılar korunur; `""` kaçışı desteklenir.
 */
export function satiriBol(satir: string, ayirici: string): string[] {
  if (ayirici === "\t") {
    return satir.split("\t").map((h) => h.trim());
  }

  const hucreler: string[] = [];
  let mevcut = "";
  let tirnakIcinde = false;

  for (let i = 0; i < satir.length; i++) {
    const ch = satir[i];

    if (ch === '"') {
      if (tirnakIcinde && satir[i + 1] === '"') {
        mevcut += '"';
        i++;
      } else {
        tirnakIcinde = !tirnakIcinde;
      }
      continue;
    }

    if (ch === ayirici && !tirnakIcinde) {
      hucreler.push(mevcut.trim());
      mevcut = "";
      continue;
    }

    mevcut += ch;
  }

  hucreler.push(mevcut.trim());
  return hucreler;
}

/** Metnin ilk dolu satırına bakarak en olası ayırıcıyı seçer. */
export function ayiriciBul(metin: string): string {
  const ilkSatir = metin
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .find(Boolean);

  if (!ilkSatir) return ";";
  if (ilkSatir.includes("\t")) return "\t";

  const noktaliVirgul = (ilkSatir.match(/;/g) ?? []).length;
  const virgul = (ilkSatir.match(/,/g) ?? []).length;

  if (noktaliVirgul >= virgul && noktaliVirgul > 0) return ";";
  if (virgul > 0) return ",";
  return ";";
}

/**
 * Metni personel listesine çevirir.
 *
 * - BOM ve boş satırlar temizlenir.
 * - Başlık satırı atlanır.
 * - En fazla 200 kişi döner (API sınırı).
 * - Adı boş olan satırlar yok sayılır.
 */
export function parseEmployeeText(metin: string): ParsedEmployee[] {
  const temiz = String(metin ?? "").replace(/^\uFEFF/, "");
  const ayirici = ayiriciBul(temiz);
  const satirlar = temiz
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (satirlar.length === 0) return [];

  const ilk = satirlar[0];
  const basla = baslikSatiriMi(ilk, ayirici) ? 1 : 0;

  return satirlar
    .slice(basla)
    .map((satir) => {
      const hucreler = satiriBol(satir, ayirici);
      return {
        name: (hucreler[0] ?? "").replace(/\s+/g, " ").trim(),
        role: (hucreler[1] ?? "").trim(),
        phone: (hucreler[2] ?? "").trim(),
      };
    })
    .filter((e) => e.name.length > 0)
    .slice(0, 200);
}

/** Dosya uzantısı içe aktarmaya uygun mu? */
export function dosyaKabulEdilir(dosyaAdi: string): boolean {
  return /\.(csv|tsv|txt)$/i.test(dosyaAdi);
}
