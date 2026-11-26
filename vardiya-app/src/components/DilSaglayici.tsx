"use client";

import { createContext, useContext, type ReactNode } from "react";
import { t as cevir, type Dil, type SozlukAnahtari } from "@/lib/dil";

/**
 * Dil bağlamı — istemci bileşenleri `useDil()` ile çeviriye erişir.
 * Sunucu bileşenleri `cookies()`ten okuyup `t(dil, ...)` çağırır.
 */
const DilCtx = createContext<Dil>("tr");

export function DilSaglayici({ dil, children }: { dil: Dil; children: ReactNode }) {
  return <DilCtx.Provider value={dil}>{children}</DilCtx.Provider>;
}

export function useDil() {
  const dil = useContext(DilCtx);
  return {
    dil,
    t: (anahtar: SozlukAnahtari, veri?: Record<string, string | number>) => cevir(dil, anahtar, veri),
  };
}
