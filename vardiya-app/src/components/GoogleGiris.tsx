"use client";

import { useEffect, useRef, useState } from "react";

/**
 * "Google ile devam et" düğmesi — Google Identity Services (GSI).
 *
 * Neden bu yöntem: **client secret gerektirmez**. Tarayıcıda Google'ın kendi
 * düğmesi çizilir, dönen ID token sunucuda doğrulanır (`/api/auth/google/gsi`).
 * Sunucuda saklanan bir sır olmadığı için sızma riski de yok.
 *
 * Düğme, Google'ın marka kurallarına uygun olarak kendi iframe'i içinde gelir;
 * bu yüzden görünümü biz boyamıyoruz.
 */
type GsiCredentialResponse = { credential?: string; select_by?: string };

type GsiWindow = Window & {
  google?: {
    accounts: {
      id: {
        initialize: (ayar: {
          client_id: string;
          callback: (yanit: GsiCredentialResponse) => void;
          auto_select?: boolean;
          cancel_on_tap_outside?: boolean;
          locale?: string;
          ux_mode?: "popup" | "redirect";
          login_uri?: string;
        }) => void;
        renderButton: (
          hedef: HTMLElement,
          ayar: {
            type?: string;
            theme?: string;
            size?: string;
            text?: string;
            shape?: string;
            logo_alignment?: string;
            width?: number;
            locale?: string;
          },
        ) => void;
        disableAutoSelect: () => void;
      };
    };
  };
};

const BETIK = "https://accounts.google.com/gsi/client";

function betigiYukle(): Promise<void> {
  return new Promise((cozum, red) => {
    if ((window as GsiWindow).google?.accounts?.id) return cozum();
    const varOlan = document.querySelector<HTMLScriptElement>(`script[src="${BETIK}"]`);
    if (varOlan) {
      varOlan.addEventListener("load", () => cozum());
      varOlan.addEventListener("error", () => red(new Error("betik yüklenemedi")));
      return;
    }
    const s = document.createElement("script");
    s.src = BETIK;
    s.async = true;
    s.defer = true;
    s.onload = () => cozum();
    s.onerror = () => red(new Error("betik yüklenemedi"));
    document.head.appendChild(s);
  });
}

export default function GoogleGiris({
  istemciKimligi,
  hedef = "/panel",
}: {
  istemciKimligi: string;
  hedef?: string;
}) {
  const kap = useRef<HTMLDivElement>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [hazir, setHazir] = useState(false);

  useEffect(() => {
    let iptal = false;

    (async () => {
      try {
        await betigiYukle();
        if (iptal || !kap.current) return;
        const g = (window as GsiWindow).google;
        if (!g?.accounts?.id) throw new Error("GSI yok");

        g.accounts.id.initialize({
          client_id: istemciKimligi,
          locale: "tr",
          cancel_on_tap_outside: true,
          // "redirect" modu: popup engelleyicilerine takılmaz; Google, ID token'ı
          // doğrudan sunucuya form olarak gönderir, sunucu oturumu açar ve yönlendirir.
          ux_mode: "redirect",
          login_uri: `${window.location.origin}/api/auth/google/gsi`,
          callback: async (yanit) => {
            if (!yanit.credential) {
              setHata("Google girişi tamamlanmadı.");
              return;
            }
            try {
              const r = await fetch("/api/auth/google/gsi", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ credential: yanit.credential, next: hedef }),
              });
              const j = (await r.json().catch(() => ({}))) as { ok?: boolean; hedef?: string; hata?: string };
              if (!r.ok || !j.ok) {
                setHata(j.hata ?? "Google ile giriş yapılamadı.");
                return;
              }
              window.location.assign(j.hedef ?? "/panel");
            } catch {
              setHata("Bağlantı kurulamadı. Lütfen tekrar dene.");
            }
          },
        });

        const genislik = Math.min(400, Math.max(220, kap.current.clientWidth || 320));
        g.accounts.id.renderButton(kap.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: genislik,
          locale: "tr",
        });
        setHazir(true);
      } catch {
        if (!iptal) setHata("Google düğmesi yüklenemedi. Sayfayı yenileyip tekrar dene.");
      }
    })();

    return () => {
      iptal = true;
    };
  }, [istemciKimligi, hedef]);

  return (
    <div>
      <div ref={kap} className="flex min-h-[44px] w-full items-center justify-center [color-scheme:light]" />
      {!hazir && !hata ? (
        <div className="h-[44px] w-full animate-pulse rounded-[10px] border border-[#2a2a30] bg-[#f7f7f8]" aria-hidden />
      ) : null}
      {hata ? (
        <p role="alert" className="mt-2 text-[12px] leading-relaxed text-[#cfa9a9]">
          {hata}
        </p>
      ) : null}
    </div>
  );
}
