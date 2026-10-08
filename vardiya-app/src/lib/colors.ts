import type { ColorKey } from "./types";

// Tailwind 4 sınıfları dinamik üretilemediği için TAM metin olarak yazılır.
export const COLOR_CLASSES: Record<
  ColorKey,
  { chip: string; dot: string; text: string }
> = {
  sky: {
    chip: "bg-sky-100 text-sky-800 border-sky-200",
    dot: "bg-sky-500",
    text: "text-sky-700",
  },
  emerald: {
    chip: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
  },
  amber: {
    chip: "bg-amber-100 text-amber-900 border-amber-200",
    dot: "bg-amber-500",
    text: "text-amber-700",
  },
  violet: {
    chip: "bg-violet-100 text-violet-800 border-violet-200",
    dot: "bg-violet-500",
    text: "text-violet-700",
  },
  rose: {
    chip: "bg-rose-100 text-rose-800 border-rose-200",
    dot: "bg-rose-500",
    text: "text-rose-700",
  },
  cyan: {
    chip: "bg-cyan-100 text-cyan-800 border-cyan-200",
    dot: "bg-cyan-500",
    text: "text-cyan-700",
  },
  lime: {
    chip: "bg-lime-100 text-lime-800 border-lime-200",
    dot: "bg-lime-500",
    text: "text-lime-700",
  },
  orange: {
    chip: "bg-orange-100 text-orange-900 border-orange-200",
    dot: "bg-orange-500",
    text: "text-orange-700",
  },
  fuchsia: {
    chip: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
    dot: "bg-fuchsia-500",
    text: "text-fuchsia-700",
  },
  teal: {
    chip: "bg-teal-100 text-teal-800 border-teal-200",
    dot: "bg-teal-500",
    text: "text-teal-700",
  },
};

export const COLOR_PALETTE: ColorKey[] = [
  "sky",
  "emerald",
  "amber",
  "violet",
  "rose",
  "cyan",
  "lime",
  "orange",
  "fuchsia",
  "teal",
];

/** Sırayla renk döndürür (personel eklerken kullanılır) */
export function nextColor(index: number): ColorKey {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}
