/**
 * SQL paneli için **salt-okunur** sorgu kapısı.
 *
 * Neden bu kadar katı: panel, veritabanının tamamına erişen tek nokta. Kural
 * ihlali (yanlışlıkla `DROP`) geri alınamaz. Bu yüzden yalnızca okuma
 * ifadeleri geçer ve metin **ham SQL olarak** çalıştırılmadan önce buradan
 * doğrulanır.
 *
 * İzin verilenler:
 *   SELECT … , WITH … SELECT … , EXPLAIN … , PRAGMA table_info/index_list/…
 *
 * Yasaklar:
 *   • Birden fazla ifade (`;`)
 *   • Yorumlar (`--`, `/*`) — gizleme yolu
 *   • Yazma/şema anahtar sözcükleri (INSERT/UPDATE/DELETE/DROP/ALTER/CREATE/…)
 *   • Dosya/eklenti (ATTACH/DETACH/LOAD_EXTENSION), işlem (BEGIN/COMMIT…)
 *
 * Sonuç kümesi çağıran tarafta ayrıca sınırlanır (LIMIT 201).
 */

export const SQL_AZAMI_UZUNLUK = 2000;
export const SQL_SATIR_SINIRI = 200;

const YASAK_ANAHTARLAR = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "ALTER",
  "CREATE",
  "REPLACE",
  "TRUNCATE",
  "ATTACH",
  "DETACH",
  "VACUUM",
  "REINDEX",
  "ANALYZE",
  "TRIGGER",
  "LOAD_EXTENSION",
  "BEGIN",
  "COMMIT",
  "ROLLBACK",
  "SAVEPOINT",
  "RELEASE",
  "PRAGMA",
];

/** PRAGMA'da yalnızca okuma amaçlı alt komutlar. */
const IZINLI_PRAGMA = new Set([
  "table_info",
  "index_list",
  "index_info",
  "foreign_key_list",
  "database_list",
  "compile_options",
]);

export type SqlKontrol =
  | { ok: true; sql: string }
  | { ok: false; hata: string };

function ilkKelime(sql: string): string {
  return (sql.trim().split(/\s+/)[0] ?? "").toUpperCase();
}

/**
 * Sorguyu doğrular ve gerekiyorsa `LIMIT` ekler.
 * Dönen `sql` **değiştirilmiş** olabilir (yalnızca LIMIT eki).
 */
export function sqlKontrol(girdi: string): SqlKontrol {
  const ham = String(girdi ?? "").trim();
  if (!ham) return { ok: false, hata: "Sorgu boş." };
  if (ham.length > SQL_AZAMI_UZUNLUK) {
    return { ok: false, hata: `Sorgu çok uzun (en fazla ${SQL_AZAMI_UZUNLUK} karakter).` };
  }
  if (ham.includes("--") || ham.includes("/*") || ham.includes("*/")) {
    return { ok: false, hata: "SQL yorumları bu panelde kapalı." };
  }

  // Sondaki tek noktalı virgül kabul, ortada/başta olan reddedilir.
  const noktali = ham.replace(/;\s*$/, "");
  if (noktali.includes(";")) {
    return { ok: false, hata: "Tek seferde yalnızca bir sorgu çalıştırılabilir." };
  }

  const temiz = noktali.trim();
  const ilk = ilkKelime(temiz);

  if (ilk === "PRAGMA") {
    const parca = temiz.split(/\s+/);
    const ad = (parca[1] ?? "").split(/[(\s]/)[0].replace(/[;]/g, "").toLowerCase();
    if (!IZINLI_PRAGMA.has(ad)) {
      return { ok: false, hata: "Bu PRAGMA komutuna izin yok (yalnızca tablo/indeks bilgisi)." };
    }
    return { ok: true, sql: temiz };
  }

  if (!["SELECT", "WITH", "EXPLAIN"].includes(ilk)) {
    return { ok: false, hata: "Yalnızca SELECT / WITH / EXPLAIN / PRAGMA çalıştırılabilir." };
  }

  // Anahtar sözcük kontrolü (kelime sınırı: `createdAt` yanlış eşleşmesin).
  for (const kelime of YASAK_ANAHTARLAR) {
    if (kelime === "PRAGMA") continue;
    const desen = new RegExp(`\\b${kelime}\\b`, "i");
    if (desen.test(temiz)) {
      return { ok: false, hata: `Bu panel salt-okunur; "${kelime}" kullanılamaz.` };
    }
  }

  // Sonuç kümesini sınırla (kullanıcı kendi LIMIT'ini yazdıysa dokunma).
  const limitVar = /\blimit\b/i.test(temiz);
  const sql = limitVar ? temiz : `${temiz} LIMIT ${SQL_SATIR_SINIRI + 1}`;

  return { ok: true, sql };
}

/** Sonuç satırlarını JSON'a çevrilebilir hâle getirir (BigInt → sayı/metin). */
export function sqlJsonlastir(satirlar: Record<string, unknown>[]): Record<string, unknown>[] {
  return satirlar.map((satir) => {
    const cikti: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(satir)) {
      if (typeof v === "bigint") cikti[k] = Number(v);
      else if (v instanceof Uint8Array) cikti[k] = `<${v.length} bayt>`;
      else if (v instanceof Date) cikti[k] = v.toISOString();
      else cikti[k] = v;
    }
    return cikti;
  });
}
