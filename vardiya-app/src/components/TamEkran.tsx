"use client";

import { useEffect, useState } from "react";

/**
 * Tam ekran düğmesi.
 *
 * Masaüstü ve Android tarayıcılarda Fullscreen API ile çalışır.
 * iPhone/iPad Safari'de programatik tam ekran yoktur; kullanıcıya
 * "Ana Ekrana Ekle" yolu gösterilir.
 */
export default function TamEkran({
  className = "btn-ghost h-12 px-5",
}: {
  className?: string;
}) {
  const [aktif, setAktif] = useState(false);

  useEffect(() => {
    function dinle() {
      setAktif(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", dinle);
    return () => document.removeEventListener("fullscreenchange", dinle);
  }, []);

  async function degistir() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        return;
      }
      window.alert(
        "Bu tarayıcı tam ekranı desteklemiyor. iPhone/iPad'de Paylaş → Ana Ekrana Ekle ile tam ekran açabilirsin."
      );
    } catch {
      /* kullanıcı iptal etti */
    }
  }

  return (
    <button
      type="button"
      onClick={degistir}
      aria-pressed={aktif}
      title={aktif ? "Tam ekrandan çık" : "Tam ekran"}
      className={className}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
        aria-hidden
      >
        {aktif ? (
          <path
            d="M8 3v3a2 2 0 0 1-2 2H3M16 3v3a2 2 0 0 0 2 2h3M8 21v-3a2 2 0 0 0-2-2H3M16 21v-3a2 2 0 0 1 2-2h3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
      <span>{aktif ? "Tam ekrandan çık" : "Tam ekran"}</span>
    </button>
  );
}
