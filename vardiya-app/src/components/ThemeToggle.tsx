"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "vardiya-theme";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* yoksay */
    }
  }

  return (
    <button
      onClick={toggle}
      title={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      aria-label={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      className="rounded-md px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
