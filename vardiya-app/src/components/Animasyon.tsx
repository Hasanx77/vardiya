"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Scroll ile görünür olan bölümleri yumuşakça yerine oturtur.
 * `data-reveal` taşıyan her öğe, ekrana girdiğinde `.gorundu` alır.
 * Hareket azaltma tercihi CSS tarafında kapatılır.
 */
export default function Animasyon() {
  const pathname = usePathname();

  useEffect(() => {
    const ogeler = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (ogeler.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      ogeler.forEach((o) => o.classList.add("gorundu"));
      return;
    }

    const gozcu = new IntersectionObserver(
      (girisler) => {
        for (const giris of girisler) {
          if (!giris.isIntersecting) continue;
          giris.target.classList.add("gorundu");
          gozcu.unobserve(giris.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );

    ogeler.forEach((o) => gozcu.observe(o));
    return () => gozcu.disconnect();
  }, [pathname]);

  return null;
}
