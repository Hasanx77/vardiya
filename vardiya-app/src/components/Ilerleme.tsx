"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Sayfanın en üstünde ince amber ilerleme çizgisi.
 * Okuma/gezinme hissini güçlendirir; içerik kaplamaz.
 */
export default function Ilerleme() {
  const cubuk = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function guncelle() {
      const toplam = document.documentElement.scrollHeight - window.innerHeight;
      const oran = toplam > 0 ? Math.min(100, Math.max(0, (window.scrollY / toplam) * 100)) : 0;
      if (cubuk.current) cubuk.current.style.width = `${oran}%`;
    }

    guncelle();
    window.addEventListener("scroll", guncelle, { passive: true });
    window.addEventListener("resize", guncelle);
    return () => {
      window.removeEventListener("scroll", guncelle);
      window.removeEventListener("resize", guncelle);
    };
  }, [pathname]);

  return <div ref={cubuk} className="ilerleme" aria-hidden="true" />;
}
