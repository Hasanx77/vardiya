"use client";

import { useEffect, useRef, type ReactNode } from "react";

const ODAK_SECICI =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Erişilebilir modal.
 *
 * - ESC ile kapanır, arka plan kaydırması kilitlenir
 * - Açılınca ilk odaklanabilir öğeye odaklanır, kapanınca eski yere döner
 * - Tab/Shift+Tab odak halkası modalın içinde kalır
 * - Ekran okuyucular `role="dialog"` + `aria-modal` ile bilgilendirilir
 */
export default function Modal({
  acik,
  kapat,
  baslik,
  children,
  genislik = "max-w-md",
}: {
  acik: boolean;
  kapat: () => void;
  baslik: string;
  children: ReactNode;
  genislik?: string;
}) {
  const kutu = useRef<HTMLDivElement>(null);
  // `kapat` her render'da yeni bir fonksiyon olabilir; efekti tekrar
  // çalıştırıp odağı sıfırlamamak için güncel referansı effect içinde tutuyoruz.
  const kapatRef = useRef(kapat);
  useEffect(() => {
    kapatRef.current = kapat;
  });

  useEffect(() => {
    if (!acik) return;

    const oncekiOdak = document.activeElement as HTMLElement | null;
    const oncekiTasma = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") kapatRef.current();
    }
    document.addEventListener("keydown", esc);

    const odakZaman = window.setTimeout(() => {
      const ilk = kutu.current?.querySelector<HTMLElement>(ODAK_SECICI);
      ilk?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = oncekiTasma;
      document.removeEventListener("keydown", esc);
      window.clearTimeout(odakZaman);
      oncekiOdak?.focus?.();
    };
  }, [acik]);

  if (!acik) return null;

  function tusHareketi(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab" || !kutu.current) return;
    const odaklar = Array.from(
      kutu.current.querySelectorAll<HTMLElement>(ODAK_SECICI)
    ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
    if (odaklar.length === 0) return;

    const ilk = odaklar[0];
    const son = odaklar[odaklar.length - 1];
    if (e.shiftKey && document.activeElement === ilk) {
      e.preventDefault();
      son.focus();
    } else if (!e.shiftKey && document.activeElement === son) {
      e.preventDefault();
      ilk.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onClick={() => kapatRef.current()}
      role="presentation"
    >
      <div
        ref={kutu}
        role="dialog"
        aria-modal="true"
        aria-label={baslik}
        onKeyDown={tusHareketi}
        onClick={(e) => e.stopPropagation()}
        className={`kart w-full ${genislik} max-h-[85vh] overflow-y-auto p-5 shadow-xl`}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{baslik}</h2>
          <button
            type="button"
            onClick={() => kapatRef.current()}
            aria-label="Kapat"
            className="-mr-1 -mt-1 grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
