"use client";

import { useState } from "react";

/**
 * Şifre alanı + göster/gizle düğmesi (yazarken hata yapmayı azaltır).
 * Caps Lock açıksa küçük bir uyarı gösterir: yanlış şifre girişlerinin
 * en sık nedeni budur.
 */
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
  const [caps, setCaps] = useState(false);

  const capsKontrol = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") {
      setCaps(e.getModifierState("CapsLock"));
    }
  };

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
          aria-describedby={caps ? `${id}-caps` : undefined}
          onKeyDown={capsKontrol}
          onKeyUp={capsKontrol}
          onBlur={() => setCaps(false)}
          className="giris pr-16"
        />
        <button
          type="button"
          onClick={() => setGoster((g) => !g)}
          className="sifre-goster absolute right-1 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[11px] font-medium"
          aria-label={goster ? "Şifreyi gizle" : "Şifreyi göster"}
          aria-pressed={goster}
        >
          {goster ? "Gizle" : "Göster"}
        </button>
      </div>
      {caps ? (
        <p id={`${id}-caps`} role="status" className="sifre-uyari">
          Caps Lock açık — şifre büyük harfle yazılıyor.
        </p>
      ) : null}
    </div>
  );
}
