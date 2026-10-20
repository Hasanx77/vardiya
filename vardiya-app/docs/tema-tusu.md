# Aydınlık / Karanlık Tema Tuşu

Vardiya arayüzünün sağ üstünde duran tema geçiş düğmesi.

## Ne yapar?

- Koyu temadayken **"☀ Aydınlık"** yazar; basınca açık temaya geçer.
- Açık temadayken **"🌙 Karanlık"** yazar; basınca koyu temaya geçer.
- Seçim `localStorage` içinde `vardiya-theme` anahtarında saklanır
  (`"dark"` / `"light"`) ve sayfa yenilense de korunur.
- Hiç seçim yapılmamışsa işletim sisteminin tema tercihi
  (`prefers-color-scheme`) kullanılır.
- Aynı site başka bir sekmede açıksa tema orada da değişir (`storage` olayı).

## Nerede?

| Dosya | Görev |
|---|---|
| `src/components/ThemeToggle.tsx` | Düğme, ikonlar, tıklama ve `localStorage` mantığı |
| `src/app/globals.css` | `.tema-tus`, `.tema-simge`, `.tema-yazi` stilleri |
| `src/app/layout.tsx` | İlk boyamadan önce temayı uygulayan küçük script (FOUC önleyici) |

Tema, `<html>` etiketine eklenen `dark` sınıfıyla yönetilir. Renkler
`globals.css` başındaki CSS değişkenlerinden gelir (`--zemin`, `--yuzey`,
`--cizgi`, `--metin`, `--soluk`); koyu tema bu değişkenleri ezer.

## Davranış ayrıntıları

- Düğme **o anki modu değil, gidilecek modu** yazar. Böylece "basınca ne olacak?"
  sorusu tek bakışta anlaşılır.
- Simge gerçek DOM sınıfından okunur (`useSyncExternalStore` + `MutationObserver`),
  ayrı bir React state'i tutulmaz; ilk boyamada simge yanlış görünmez.
- Mobilde yer dar olduğu için yazı gizlenir, yalnız ikon görünür (`640px` altı).
- Koyu temada güneş ikonu amber (`#fbbf24`) yanar: "buraya bas, aydınlan".

## Erişilebilirlik

- `aria-label` her zaman yapılacak eylemi söyler
  ("Aydınlık moda geç" / "Karanlık moda geç").
- Klavye odağı `globals.css` içindeki `:focus-visible` kuralıyla görünür.
- `prefers-reduced-motion` açıksa geçiş animasyonları kapanır.

## Özelleştirme

- Düğme metinleri: `ThemeToggle.tsx` içindeki `etiket` ve `tema-yazi` satırları.
- Renkler: `globals.css` → `.tema-tus`, `.tema-tus:hover`,
  `.tema-tus-koyu .tema-simge` kuralları.
- Varsayılan tema: `layout.tsx` içindeki FOUC önleyici script.

## Yayın notu

Kod değişikliği `.next` derlemesine girer; canlıya almak için normal yayın akışı
kullanılır (yerelde `npm run build` → `.next` FTP ile yükleme → Node.js Selector
RESTART). Bu özellik ilk olarak commit `3bc932e` ile yayınlandı ve
https://zihnora.com.tr üzerinde doğrulandı.
