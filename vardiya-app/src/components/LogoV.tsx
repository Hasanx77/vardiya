"use client";

/**
 * Vardiya 3B V logosu — React sarmalayıcı.
 *
 * WebGL sahnesini (`src/lib/logo-v/sahne.ts`) yalnızca görünürken çalıştırır;
 * sekme arkadayken ve ekran dışındayken durur. DPR 2'yi geçmez.
 * "Hareketi azalt" tercihinde tek bir statik kare çizer.
 *
 * Fare etkileşimi: V, fare sayfada **nereye giderse oraya bakar** — kendi
 * kutusunun içi/dışı ayrımı yok. İmleç ekranın solundaysa sola, yukarıdaysa
 * yukarı döner; pencere dışına çıkınca yumuşakça öne bakar.
 */
import { useEffect, useId, useRef, useState } from "react";
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
  // WebGL yoksa veya bağlam düşerse boş kutu göstermeyelim: statik V'ye düşer.
  const [cizimYok, setCizimYok] = useState(false);
  const gradyanKimlik = `logo-yedek-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    const kap = kapRef.current;
    const tuval = tuvalRef.current;
    if (!kap || !tuval) return;

    const hareketMedya = window.matchMedia("(prefers-reduced-motion: reduce)");
    const oynasin = () => !hareketMedya.matches && !durgun;

    let sahne: VLogoSahnesi;
    try {
      sahne = new VLogoSahnesi(tuval, { hareket: oynasin() });
    } catch {
      // WebGL kurulamadı → statik yedeğe geç. Senkron setState uyarısını
      // önlemek için durum güncellemesi sıraya alınır.
      queueMicrotask(() => setCizimYok(true));
      return;
    }

    const baglamKaybi = (e: Event) => {
      e.preventDefault();
      setCizimYok(true);
    };
    tuval.addEventListener("webglcontextlost", baglamKaybi);
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
      // Dokunmatikte sayfa kaydırması sırasında logo dönmesin.
      if (e.pointerType === "touch") return;
      const genislik = window.innerWidth || 1;
      const yukseklik = window.innerHeight || 1;
      // Ekranın tamamı -1..1: V imlecin olduğu yöne bakar.
      sahne.isaretle((e.clientX / genislik) * 2 - 1, (e.clientY / yukseklik) * 2 - 1);
    };
    const birak = () => sahne.isaretBirak();

    // Kutuya değil pencereye bağlıyız: imleç sayfada nerede olursa olsun V ona döner.
    document.addEventListener("pointermove", isaret, { passive: true });
    document.addEventListener("pointerleave", birak);
    window.addEventListener("blur", birak);

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
      document.removeEventListener("pointermove", isaret);
      document.removeEventListener("pointerleave", birak);
      window.removeEventListener("blur", birak);
      tuval.removeEventListener("webglcontextlost", baglamKaybi);
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
      {cizimYok ? (
        <svg viewBox="0 0 24 24" className="h-full w-full p-[12%]" role="img" aria-label={etiket}>
          <defs>
            <linearGradient id={gradyanKimlik} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f6cd7e" />
              <stop offset="55%" stopColor="#e8ae55" />
              <stop offset="100%" stopColor="#c98a2e" />
            </linearGradient>
          </defs>
          <path
            d="M3.6 4.4h3.7L12 15.6 16.7 4.4h3.7L13.8 20.4h-3.6L3.6 4.4Z"
            fill={`url(#${gradyanKimlik})`}
          />
        </svg>
      ) : (
        <canvas ref={tuvalRef} role="img" aria-label={etiket} />
      )}
    </div>
  );
}
