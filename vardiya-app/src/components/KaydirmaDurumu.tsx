"use client";

import { useEffect } from "react";

/**
 * Sayfa kaydırıldığında <html> üzerine `kaydirildi` sınıfı ekler.
 * Header'ın ince gölgesi bu sınıfla yumuşakça açılır.
 */
export default function KaydirmaDurumu() {
  useEffect(() => {
    function guncelle() {
      document.documentElement.classList.toggle("kaydirildi", window.scrollY > 8);
    }
    guncelle();
    window.addEventListener("scroll", guncelle, { passive: true });
    return () => window.removeEventListener("scroll", guncelle);
  }, []);

  return null;
}
