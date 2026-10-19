"use client";

import { useState } from "react";

/** Şifre alanı + göster/gizle düğmesi (yazarken hata yapmayı azaltır). */
export default function SifreAlani({
  id,
  name,
  label,
  autoComplete,
  placeholder,
  minLength,
  autoFocus,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  placeholder?: string;
  minLength?: number;
  autoFocus?: boolean;
}) {
  const [goster, setGoster] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="etiket">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          name={name}
          type={goster ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="giris pr-16"
        />
        <button
          type="button"
          onClick={() => setGoster((g) => !g)}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          aria-label={goster ? "Şifreyi gizle" : "Şifreyi göster"}
        >
          {goster ? "Gizle" : "Göster"}
        </button>
      </div>
    </div>
  );
}
