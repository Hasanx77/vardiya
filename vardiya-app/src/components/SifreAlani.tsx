"use client";

import { useState } from "react";
import { useDil } from "@/components/DilSaglayici";

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
  value,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  placeholder?: string;
  minLength?: number;
  autoFocus?: boolean;
  /** Verilirse alan denetimli (controlled) olur. */
  value?: string;
  onChange?: (deger: string) => void;
}) {
  const [goster, setGoster] = useState(false);
  const [caps, setCaps] = useState(false);
  const { t } = useDil();

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
          {...(value !== undefined
            ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value) }
            : {})}
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
          aria-label={goster ? t("auth.hide") : t("auth.show")}
          aria-pressed={goster}
        >
          {goster ? t("auth.hide") : t("auth.show")}
        </button>
      </div>
      {caps ? (
        <p id={`${id}-caps`} role="status" className="sifre-uyari">
          {t("auth.caps")}
        </p>
      ) : null}
    </div>
  );
}
