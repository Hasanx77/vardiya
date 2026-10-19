/**
 * Basit, bellek içi giriş denemesi sınırı.
 *
 * Amaç: şifre deneme (brute-force) saldırısını yavaşlatmak. Paylaşımlı
 * sunucuda tek Node süreci çalıştığı için modül düzeyinde bir Map yeterli;
 * süreç yeniden başlarsa sayaç sıfırlanır (kabul edilebilir).
 *
 * Anahtar: IP + e-posta. Böylece bir kullanıcının yanlış yazması diğer
 * kullanıcıları etkilemez; aynı IP'den farklı hesaplar da ayrı sayılır.
 */

const PENCERE_MS = 10 * 60 * 1000; // 10 dakika
const AZAMI_DENEME = 10;

type Kayit = { sayi: number; ilk: number };

const kayitlar = new Map<string, Kayit>();
let sonTemizlik = 0;

function temizle(simdi: number) {
  // Bellek şişmesin: dakikada en fazla bir kez süresi geçenleri at.
  if (simdi - sonTemizlik < 60_000) return;
  sonTemizlik = simdi;
  for (const [anahtar, kayit] of kayitlar) {
    if (simdi - kayit.ilk > PENCERE_MS) kayitlar.delete(anahtar);
  }
}

/** Bu anahtar için yeni deneme hakkı var mı? */
export function denemeIzinli(anahtar: string): boolean {
  const simdi = Date.now();
  temizle(simdi);

  const kayit = kayitlar.get(anahtar);
  if (!kayit) return true;
  if (simdi - kayit.ilk > PENCERE_MS) {
    kayitlar.delete(anahtar);
    return true;
  }
  return kayit.sayi < AZAMI_DENEME;
}

/** Başarısız denemeyi say. */
export function denemeBasarisiz(anahtar: string): void {
  const simdi = Date.now();
  const kayit = kayitlar.get(anahtar);
  if (!kayit || simdi - kayit.ilk > PENCERE_MS) {
    kayitlar.set(anahtar, { sayi: 1, ilk: simdi });
    return;
  }
  kayit.sayi += 1;
}

/** Başarılı girişte sayacı sıfırla. */
export function denemeTemizle(anahtar: string): void {
  kayitlar.delete(anahtar);
}
