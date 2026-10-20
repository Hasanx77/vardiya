import type { ReactNode } from "react";

/**
 * Rota değişimlerinde sayfayı yumuşakça getirir.
 * Layout'un flex akışını bozmamak için flex-1 kolon olarak sarar.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="sayfa-gecis flex flex-1 flex-col">{children}</div>;
}
