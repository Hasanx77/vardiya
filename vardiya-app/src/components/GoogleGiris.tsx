"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDil } from "@/components/DilSaglayici";

/**
 * "Google ile devam et" düğmesi — Google Identity Services (GSI), **popup** modu.
 *
 * Neden popup:
 *   • `redirect` modunda Google, ID token'ı sitenin dışından **form POST** ile
 *     gönderiyor; paylaşımlı hosting'in önündeki güvenlik katmanları bu gövdeyi
 *     bozabiliyor (canlıda `tokeninfo` 400 hatası yaşandı).
 *   • Popup modunda token, kendi sayfamızdaki JS geri çağrısına gelir ve
 *     **aynı kaynaklı** JSON isteğiyle gönderilir: araya giren katman yok.
 *
 * Düğme, Google'ın marka kurallarına uygun olarak kendi iframe'i içinde gelir.
 * Client secret gerekmez; sunucuda saklanan bir Google sırrı yoktur.
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

type Durum = "yukleniyor" | "hazir" | "gonderiliyor" | "hata";

export default function GoogleGiris({
  istemciKimligi,
  hedef = "/panel",
}: {
  istemciKimligi: string;
  hedef?: string;
}) {
  const kap = useRef<HTMLDivElement>(null);
  const { dil } = useDil();
  const [durum, setDurum] = useState<Durum>("yukleniyor");
  const [hata, setHata] = useState<string | null>(null);

  const girisYap = useCallback(
    async (credential: string) => {
      setDurum("gonderiliyor");
      setHata(null);
      try {
        const r = await fetch("/api/auth/google/gsi", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ credential, next: hedef }),
        });
        const j = (await r.json().catch(() => ({}))) as {
          ok?: boolean;
          hedef?: string;
          hata?: string;
        };
        if (!r.ok || !j.ok) {
          setHata(j.hata ?? "Google ile giriş yapılamadı. Lütfen tekrar dene.");
          setDurum("hata");
          return;
        }
        window.location.assign(j.hedef ?? "/panel");
      } catch {
        setHata("Bağlantı kurulamadı. İnternet bağlantını kontrol edip tekrar dene.");
        setDurum("hata");
      }
    },
    [hedef],
  );

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
          locale: dil,
          cancel_on_tap_outside: true,
          ux_mode: "popup",
          callback: (yanit) => {
            if (!yanit.credential) {
              // Kullanıcı pencereyi kapattı: sert hata gösterme.
              setDurum("hazir");
              return;
            }
            void girisYap(yanit.credential);
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
          locale: dil,
        });
        setDurum("hazir");
      } catch {
        if (!iptal) {
          setDurum("hata");
          setHata(
            "Google düğmesi yüklenemedi. Sayfayı yenileyip tekrar dene; dilersen e-posta ile giriş yapabilirsin.",
          );
        }
      }
    })();

    return () => {
      iptal = true;
    };
  }, [istemciKimligi, girisYap, dil]);

  return (
    <div>
      <div
        ref={kap}
        className="flex min-h-[44px] w-full items-center justify-center [color-scheme:light]"
      />

      {durum === "yukleniyor" ? (
        <div
          className="h-[44px] w-full animate-pulse rounded-[10px] border border-[#2a2a30] bg-[#f7f7f8]"
          aria-hidden
        />
      ) : null}

      {durum === "gonderiliyor" ? (
        <p className="mt-2 text-center text-[12px] text-[#a1a1aa]" role="status">
          Google hesabın doğrulanıyor…
        </p>
      ) : null}

      {hata ? (
        <p role="alert" className="mt-2 text-[12px] leading-relaxed text-[#cfa9a9]">
          {hata}
        </p>
      ) : null}
    </div>
  );
}
