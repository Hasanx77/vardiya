import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Uygulama içi sayfaların ortak başlığı.
 * Aynı üst etiket + başlık + açıklama + "Plan"a dönüş düzenini tek yerden
 * verir; sayfalar arasındaki boşluk/hiza farklarını önler.
 */
export default function SayfaBasligi({
  ust,
  baslik,
  alt,
  geriHref = "/panel",
  geriAd = "Plan",
  sag,
}: {
  ust: string;
  baslik: string;
  alt?: string;
  geriHref?: string;
  geriAd?: string;
  sag?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
          {ust}
        </p>
        <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
          {baslik}
        </h1>
        {alt ? <p className="mt-1 text-sm text-zinc-500">{alt}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {sag}
        <Link href={geriHref} className="btn-ikincil btn-kucuk">
          ← {geriAd}
        </Link>
      </div>
    </div>
  );
}
