/**
 * CSV üretimi — tek yerden.
 *
 * Neden ayrı dosya: panel ve raporlar farklı biçimlerde CSV üretiyordu
 * (biri tırnaklıyor, diğeri noktalı virgülle birleştiriyordu). Personel adında
 * `;` veya `"` geçtiğinde rapor bozuluyordu.
 *
 * Güvenlik: Excel, `=`, `+`, `-`, `@` ile başlayan hücreleri **formül** olarak
 * çalıştırır. Kullanıcı adı "=HYPERLINK(...)" olabilir; bu yüzden böyle
 * hücrelerin başına tek tırnak eklenir (formül enjeksiyonu).
 */

/** Tek bir hücreyi CSV'ye güvenli biçimde yazar. */
export function csvHucre(deger: string | number): string {
  let metin = String(deger ?? "");
  if (/^[=+\-@\t\r]/.test(metin)) metin = `'${metin}`;
  return `"${metin.replace(/"/g, '""')}"`;
}

/**
 * Satırlardan CSV metni üretir.
 * - Ayraç: `;` (Türkçe Excel varsayılanı)
 * - Başta BOM: Excel'in UTF-8'i (ş, ğ, ı) doğru okuması için
 * - Satır sonu: CRLF
 */
export function csvMetni(satirlar: (string | number)[][]): string {
  return "\uFEFF" + satirlar.map((satir) => satir.map(csvHucre).join(";")).join("\r\n");
}

/** Tarayıcıda CSV dosyası indirir. */
export function csvIndir(dosyaAdi: string, satirlar: (string | number)[][]) {
  const blob = new Blob([csvMetni(satirlar)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = dosyaAdi;
  a.click();
  URL.revokeObjectURL(url);
}
