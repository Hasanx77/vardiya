/**
 * Tema (koyu/açık) tercihini **ilk boyamadan önce** uygulayan küçük betik.
 *
 * Neden ayrı dosya: bu betik sayfaya gömülü (inline) yazılıyor ve sıkı CSP
 * altında `nonce` taşımıyor. Bu yüzden CSP'de **SHA-256 özetiyle** izin
 * veriyoruz. Metin değişirse özet de değişir → `tema-betik.test.ts` uyuşmazlığı
 * anında yakalar (aksi halde koyu temada beyaz parlama geri gelirdi).
 */
export const TEMA_BETIGI =
  "try{var t=localStorage.getItem('vardiya-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}";

/** CSP `script-src` içine yazılan özet (middleware kullanır). */
export const TEMA_BETIGI_HASH = "sha256-QGDHNezwJ4lI7IwcVjKcobOhfvjt/5WlH5vyFPPpJro=";
