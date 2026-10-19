"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "vardiya-theme";

/**
 * Tema düğmesi.
 *
 * Koyu tema `<html class="dark">` ile yönetilir. React state'i yalnızca
 * görünen simgeyi belirler; gerçek kaynak DOM sınıfıdır. Böylece ilk boyamada
 * (FOUC önleyici script çalıştıktan sonra) düğme doğru simgeyle açılır ve
 * effect içinde setState çağırmaya gerek kalmaz.
 */
function abone(geriCagri: () => void) {
  const gozcu = new MutationObserver(geriCagri);
  gozcu.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => gozcu.disconnect();
}

export default function ThemeToggle() {
  const dark = useSyncExternalStore(
    abone,
    () => document.documentElement.classList.contains("dark"),
    () => false
  );

  function toggle() {
    const yeni = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", yeni);
    try {
      localStorage.setItem(STORAGE_KEY, yeni ? "dark" : "light");
    } catch {
      /* yoksay */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      aria-label={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      aria-pressed={dark}
      className="grid h-9 w-9 place-items-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
    >
      <span aria-hidden>{dark ? "☀️" : "🌙"}</span>
    </button>
  );
}
