"use client";

/**
 * Vardiya 3B V logosu — React sarmalayıcı.
 *
 * WebGL sahnesini (`src/lib/logo-v/sahne.ts`) yalnızca görünürken çalıştırır;
 * sekme arkadayken ve ekran dışındayken durur. DPR 2'yi geçmez.
 * "Hareketi azalt" tercihinde tek bir statik kare çizer.
 */
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { VLogoSahnesi } from "@/lib/logo-v/sahne";

type Props = {
  /** Kenar uzunluğu: sayı (px) veya CSS ölçüsü ("min(420px, 80vw)"). */
  boyut?: number | string;
  sinif?: string;
  etiket?: string;
  durgun?: boolean;
};

export default function LogoV({
  boyut = 180,
  sinif = "",
  etiket = "Vardiya logosu: ışığı yansıtan üç boyutlu V",
  durgun = false,
}: Props) {
  const kapRef = useRef<HTMLDivElement>(null);
  const tuvalRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const kap = kapRef.current;
    const tuval = tuvalRef.current;
    if (!kap || !tuval) return;

    const hareketMedya = window.matchMedia("(prefers-reduced-motion: reduce)");
    const oynasin = () => !hareketMedya.matches && !durgun;

    const sahne = new VLogoSahnesi(tuval, { hareket: oynasin() });
    if (process.env.NODE_ENV === "development") {
      const kutu = window as unknown as { __vardiyaV?: VLogoSahnesi[] };
      kutu.__vardiyaV = kutu.__vardiyaV ?? [];
      kutu.__vardiyaV.push(sahne);
    }

    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const boyutlandir = () => {
      const olcu = kap.getBoundingClientRect();
      if (olcu.width < 1 || olcu.height < 1) return;
      sahne.boyutla(olcu.width, olcu.height, dpr);
      if (!oynasin()) sahne.ciz(2.6, 0.016);
    };
    boyutlandir();

    const boyutGozlemci = new ResizeObserver(boyutlandir);
    boyutGozlemci.observe(kap);

    const dprYenile = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      boyutlandir();
    };
    window.addEventListener("resize", dprYenile);

    let raf = 0;
    let onceki = 0;
    let gorunur = false;
    let sekmeAcik = !document.hidden;

    const dongu = (simdi: number) => {
      const dt = onceki ? Math.min((simdi - onceki) / 1000, 0.05) : 0.016;
      onceki = simdi;
      sahne.ciz(simdi / 1000, dt);
      raf = requestAnimationFrame(dongu);
    };

    const basla = () => {
      if (raf || !oynasin() || !gorunur || !sekmeAcik) return;
      onceki = 0;
      raf = requestAnimationFrame(dongu);
    };

    const dur = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const gorunurlukGozlemci = new IntersectionObserver(
      (girisler) => {
        gorunur = girisler.some((g) => g.isIntersecting);
        if (gorunur) basla();
        else dur();
      },
      { threshold: 0.05 },
    );
    gorunurlukGozlemci.observe(kap);

    const sekmeDurumu = () => {
      sekmeAcik = !document.hidden;
      if (sekmeAcik) basla();
      else dur();
    };
    document.addEventListener("visibilitychange", sekmeDurumu);

    const isaret = (e: PointerEvent) => {
      const olcu = kap.getBoundingClientRect();
      if (olcu.width < 1 || olcu.height < 1) return;
      sahne.isaretle(
        ((e.clientX - olcu.left) / olcu.width) * 2 - 1,
        ((e.clientY - olcu.top) / olcu.height) * 2 - 1,
      );
    };
    const birak = () => sahne.isaretBirak();

    kap.addEventListener("pointermove", isaret);
    kap.addEventListener("pointerleave", birak);
    kap.addEventListener("pointercancel", birak);

    const hareketDegisti = () => {
      sahne.hareketAyarla(oynasin());
      if (oynasin()) basla();
      else {
        dur();
        sahne.ciz(2.6, 0.016);
      }
    };
    hareketMedya.addEventListener("change", hareketDegisti);

    basla();
    if (!oynasin()) sahne.ciz(2.6, 0.016);

    return () => {
      dur();
      boyutGozlemci.disconnect();
      gorunurlukGozlemci.disconnect();
      window.removeEventListener("resize", dprYenile);
      document.removeEventListener("visibilitychange", sekmeDurumu);
      kap.removeEventListener("pointermove", isaret);
      kap.removeEventListener("pointerleave", birak);
      kap.removeEventListener("pointercancel", birak);
      hareketMedya.removeEventListener("change", hareketDegisti);
      sahne.bosalt();
    };
  }, [durgun]);

  const olcu = typeof boyut === "number" ? `${boyut}px` : boyut;

  return (
    <div
      ref={kapRef}
      className={`logo-v ${sinif}`.trim()}
      style={
        {
          width: olcu,
          aspectRatio: "1 / 1",
          maxWidth: "100%",
        } as CSSProperties
      }
    >
      <canvas ref={tuvalRef} role="img" aria-label={etiket} />
    </div>
  );
}
