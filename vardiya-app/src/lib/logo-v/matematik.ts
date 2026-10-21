/** Küçük yardımcılar; 3B sahnede tekrar etmesin. */

export function sinirla(deger: number, alt: number, ust: number): number {
  return deger < alt ? alt : deger > ust ? ust : deger;
}

export function yumusak(t: number): number {
  const x = sinirla(t, 0, 1);
  return x * x * (3 - 2 * x);
}
