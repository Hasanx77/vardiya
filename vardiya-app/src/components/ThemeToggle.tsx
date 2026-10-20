"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "vardiya-theme";

/**
 * Aydınlık / karanlık tema tuşu.
 *
 * Koyu tema `<html class="dark">` ile yönetilir. React state'i yalnızca
 * görünen simgeyi belirler; gerçek kaynak DOM sınıfıdır. Böylece ilk boyamada
 * (FOUC önleyici script çalıştıktan sonra) düğme doğru simgeyle açılır ve
 * effect içinde setState çağırmaya gerek kalmaz.
 *
 * Düğme, o anki modu değil **gidilecek modu** yazar: koyu temada "Aydınlık",
 * açık temada "Karanlık". Böylece ne yapacağı tek bakışta anlaşılır.
 */
function koyuMu() {
  return document.documentElement.classList.contains("dark");
}

function abone(geriCagri: () => void) {
  const gozcu = new MutationObserver(geriCagri);
  gozcu.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  // Başka bir sekmede tema değişirse bu sekme de uysun.
  function depoDegisti(e: StorageEvent) {
    if (e.key !== STORAGE_KEY) return;
    document.documentElement.classList.toggle("dark", e.newValue === "dark");
  }
  window.addEventListener("storage", depoDegisti);

  return () => {
    gozcu.disconnect();
    window.removeEventListener("storage", depoDegisti);
  };
}

function GunesIkonu() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[17px] w-[17px]"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4l1.4-1.4M18 6l1.4-1.4" />
    </svg>
  );
}

function AyIkonu() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[17px] w-[17px]"
      aria-hidden
    >
      <path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z" />
    </svg>
  );
}

export default function ThemeToggle() {
  const koyu = useSyncExternalStore(abone, koyuMu, () => false);

  function degistir() {
    const yeni = !koyuMu();
    document.documentElement.classList.toggle("dark", yeni);
    try {
      localStorage.setItem(STORAGE_KEY, yeni ? "dark" : "light");
    } catch {
      /* yoksay */
    }
  }

  const etiket = koyu ? "Aydınlık moda geç" : "Karanlık moda geç";

  return (
    <button
      type="button"
      onClick={degistir}
      title={etiket}
      aria-label={etiket}
      className={`tema-tus ${koyu ? "tema-tus-koyu" : ""}`}
    >
      <span className="tema-simge" aria-hidden>
        {koyu ? <GunesIkonu /> : <AyIkonu />}
      </span>
      <span className="tema-yazi">{koyu ? "Aydınlık" : "Karanlık"}</span>
    </button>
  );
}
