"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import SifreAlani from "@/components/SifreAlani";
import { useDil } from "@/components/DilSaglayici";
import type { KodAmaci } from "@/lib/eposta-kodu";

/**
 * "E-posta kodu" akışının ortak arayüzü.
 *
 * Aynı bileşen dört işi yapar:
 *   • giris           → şifresiz giriş
 *   • sifre           → kodu doğrula + yeni şifreyi belirle
 *   • dogrulama       → oturumdaki e-postayı doğrula
 *   • eposta-degistir → yeni e-posta adresini onayla
 *
 * İki adım: (1) e-posta, (2) kod. Kod 10 dakika geçerli, 60 saniyede bir
 * yeniden istenebilir. Hatalar sunucudan gelir; istemci yalnızca gösterir.
 */
type Adim = "istek" | "kod" | "bitti";

export default function KodAkisi({
  amac,
  sabitEposta,
  baslangicEposta,
  hedef,
  basariliMetni = "İşlem tamamlandı.",
  basariliBaglanti,
}: {
  amac: Extract<KodAmaci, "giris" | "sifre" | "dogrulama" | "eposta-degistir">;
  /** Doluysa e-posta alanı gösterilmez (oturumdaki adres). */
  sabitEposta?: string;
  /** Alanın başlangıç değeri (kullanıcı değiştirebilir). */
  baslangicEposta?: string;
  /** Doğrulama sonrası gidilecek adres (varsa otomatik yönlendirme). */
  hedef?: string;
  basariliMetni?: string;
  basariliBaglanti?: { href: string; yazi: string };
}) {
  const [adim, setAdim] = useState<Adim>("istek");
  const { t } = useDil();
  const [eposta, setEposta] = useState(sabitEposta ?? baslangicEposta ?? "");
  const [kod, setKod] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifreTekrar, setSifreTekrar] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [bilgi, setBilgi] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [kalanSn, setKalanSn] = useState(0);
  const kodGirdi = useRef<HTMLInputElement>(null);

  // Yeniden gönderme sayacı
  useEffect(() => {
    if (kalanSn <= 0) return;
    const t = setTimeout(() => setKalanSn((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [kalanSn]);

  useEffect(() => {
    if (adim === "kod") kodGirdi.current?.focus();
  }, [adim]);

  async function istekGonder(e?: React.FormEvent) {
    e?.preventDefault();
    setHata(null);
    setBilgi(null);
    setYukleniyor(true);
    try {
      const r = await fetch("/api/auth/kod/gonder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: eposta, amac }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        hata?: string;
        tekrarSn?: number;
        zatenDogrulanmis?: boolean;
      };
      if (!r.ok || !j.ok) {
        setHata(j.hata ?? "Kod gönderilemedi. Lütfen tekrar dene.");
        return;
      }
      setAdim("kod");
      setKod("");
      setKalanSn(j.tekrarSn ?? 60);
      setBilgi(
        j.zatenDogrulanmis
          ? t("kod.alreadyVerified")
          : t("kod.onTheWay"),
      );
    } catch {
      setHata("Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.");
    } finally {
      setYukleniyor(false);
    }
  }

  async function koduGonder(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);
    try {
      const r = await fetch("/api/auth/kod/dogrula", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: eposta,
          amac,
          kod,
          sifre: amac === "sifre" ? sifre : undefined,
          sifreTekrar: amac === "sifre" ? sifreTekrar : undefined,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        hata?: string;
        hedef?: string;
        mesaj?: string;
        kalanDeneme?: number;
      };
      if (!r.ok || !j.ok) {
        setHata(j.hata ?? "Kod doğrulanamadı.");
        return;
      }

      const gidilecek = j.hedef ?? hedef;
      if (gidilecek) {
        window.location.assign(gidilecek);
        return;
      }
      setAdim("bitti");
      setBilgi(j.mesaj ?? basariliMetni);
    } catch {
      setHata("Bağlantı kurulamadı. Lütfen tekrar dene.");
    } finally {
      setYukleniyor(false);
    }
  }

  if (adim === "bitti") {
    return (
      <div className="mt-5 space-y-4">
        <div
          role="status"
          className="auth-uyari border-[#3f4a3a] bg-[#1b211a] text-[#dbe7d6]"
        >
          <span className="auth-uyari-ikon" aria-hidden>
            ✓
          </span>
          <div>
            <p className="font-semibold">{t("kod.doneTitle")}</p>
            <p className="mt-0.5">{bilgi ?? basariliMetni}</p>
          </div>
        </div>
        {basariliBaglanti ? (
          <Link href={basariliBaglanti.href} className="btn-birincil flex h-11 w-full items-center justify-center text-sm">
            {basariliBaglanti.yazi}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-4">
      {hata ? (
        <div role="alert" className="auth-uyari auth-uyari-hata">
          <span className="auth-uyari-ikon" aria-hidden>
            !
          </span>
          <div>
            <p className="font-semibold">{t("kod.errorTitle")}</p>
            <p className="mt-0.5">{hata}</p>
          </div>
        </div>
      ) : null}

      {adim === "istek" ? (
        <form onSubmit={istekGonder} className="space-y-4">
          {sabitEposta ? (
            <p className="rounded-lg border border-[#2a2a30] bg-[#141417] px-3 py-2.5 text-[13px] text-[#c9c9d1]">
              {t("kod.fixedEmail", { email: sabitEposta })}
            </p>
          ) : (
            <div>
              <label className="etiket" htmlFor="kod-email">
                {amac === "eposta-degistir" ? t("kod.newEmail") : t("auth.email")}
              </label>
              <input
                id="kod-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={eposta}
                onChange={(e) => setEposta(e.target.value)}
                placeholder="ornek@isletmem.com"
                className="giris mt-1"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={yukleniyor}
            className="btn-birincil h-11 w-full text-sm disabled:opacity-60"
          >
            {yukleniyor ? t("kod.sending") : t("kod.send")}
          </button>

          <p className="text-[12px] leading-relaxed text-[#8b8b93]">
            {t("kod.sentInfo")}
          </p>
        </form>
      ) : (
        <form onSubmit={koduGonder} className="space-y-4">
          <p className="rounded-lg border border-[#2a2a30] bg-[#141417] px-3 py-2.5 text-[13px] text-[#c9c9d1]">
            {t("kod.sentTo", { email: eposta })}
          </p>

          <div>
            <label className="etiket" htmlFor="kod">
              {t("kod.sixDigit")}
            </label>
            <input
              ref={kodGirdi}
              id="kod"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={kod}
              onChange={(e) => setKod(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="giris mt-1 text-center text-[22px] tracking-[0.5em]"
            />
          </div>

          {amac === "sifre" ? (
            <>
              <SifreAlani
                id="yeni-sifre"
                name="sifre"
                label={t("kod.newPassword")}
                autoComplete="new-password"
                placeholder={t("kod.newPasswordHint")}
                minLength={8}
                value={sifre}
                onChange={setSifre}
              />
              <SifreAlani
                id="yeni-sifre-tekrar"
                name="sifreTekrar"
                label={t("kod.newPasswordRepeat")}
                autoComplete="new-password"
                placeholder={t("kod.repeatHint")}
                minLength={8}
                value={sifreTekrar}
                onChange={setSifreTekrar}
              />
            </>
          ) : null}

          <button
            type="submit"
            disabled={yukleniyor || kod.length !== 6 || (amac === "sifre" && sifre.length < 8)}
            className="btn-birincil h-11 w-full text-sm disabled:opacity-50"
          >
            {yukleniyor ? t("kod.verifying") : amac === "sifre" ? t("kod.updatePassword") : t("kod.verify")}
          </button>

          <div className="flex items-center justify-between gap-3 text-[12px]">
            <button
              type="button"
              onClick={() => {
                setAdim("istek");
                setBilgi(null);
                setHata(null);
              }}
              className="text-[#a1a1aa] underline underline-offset-2"
            >
              {t("kod.changeEmail")}
            </button>
            <button
              type="button"
              disabled={kalanSn > 0 || yukleniyor}
              onClick={() => void istekGonder()}
              className="text-[#e8ae55] underline underline-offset-2 disabled:opacity-50"
            >
              {kalanSn > 0 ? t("kod.resendIn", { s: kalanSn }) : t("kod.resend")}
            </button>
          </div>

          {amac === "sifre" ? (
            <p className="text-[11.5px] leading-relaxed text-[#8b8b93]">
              {t("kod.allDevices")}
            </p>
          ) : null}
        </form>
      )}

      {bilgi && !hata ? (
        <p className="text-[12px] leading-relaxed text-[#9fb59a]" role="status">
          {bilgi}
        </p>
      ) : null}
    </div>
  );
}
