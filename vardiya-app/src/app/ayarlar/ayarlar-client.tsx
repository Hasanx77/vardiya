"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HesapSilButonu from "@/components/HesapSilButonu";
import KodAkisi from "@/components/KodAkisi";
import SifreAlani from "@/components/SifreAlani";
import { useDil } from "@/components/DilSaglayici";
import type { Ayarlar, Tema } from "@/lib/ayarlar";
import { DILLER, type Dil, type SozlukAnahtari } from "@/lib/dil";

type Bolum = "hesap" | "guvenlik" | "bildirimler" | "gorunum" | "isletme" | "veri";

const BOLUMLER: { id: Bolum; anahtar: SozlukAnahtari; ikon: string }[] = [
  { id: "hesap", anahtar: "ayar.tab.account", ikon: "👤" },
  { id: "guvenlik", anahtar: "ayar.tab.security", ikon: "🔒" },
  { id: "bildirimler", anahtar: "ayar.tab.notifications", ikon: "🔔" },
  { id: "gorunum", anahtar: "ayar.tab.appearance", ikon: "🎨" },
  { id: "isletme", anahtar: "ayar.tab.business", ikon: "🏪" },
  { id: "veri", anahtar: "ayar.tab.data", ikon: "🗂" },
];

function temaUygula(t: Tema) {
  const kok = document.documentElement;
  try {
    if (t === "sistem") {
      localStorage.removeItem("vardiya-theme");
      const koyu = window.matchMedia("(prefers-color-scheme: dark)").matches;
      kok.classList.toggle("dark", koyu);
    } else {
      const koyu = t === "koyu";
      localStorage.setItem("vardiya-theme", koyu ? "dark" : "light");
      kok.classList.toggle("dark", koyu);
    }
  } catch {
    /* gizli mod */
  }
}

export default function AyarlarClient({
  kullanici,
  isletme,
  ayarlar: ilkAyarlar,
  ikiAdim,
  sahip,
  sifreOk,
  sifreHata,
}: {
  kullanici: {
    email: string;
    username: string | null;
    createdAt: string;
    lastLoginAt: string | null;
    emailVerifiedAt: string | null;
  };
  isletme: { name: string; openTime: string; closeTime: string };
  ayarlar: Ayarlar;
  ikiAdim: { aktif: boolean; yedekKalan: number };
  sahip: boolean;
  sifreOk?: boolean;
  sifreHata?: string;
}) {
  const { t, dil } = useDil();
  const [bolum, setBolum] = useState<Bolum>("hesap");
  const [ayarlar, setAyarlar] = useState(ilkAyarlar);
  const [bildirim, setBildirim] = useState<string | null>(null);
  const [kaydediyor, setKaydediyor] = useState<string | null>(null);
  const yonlendir = useRouter();

  const [ad, setAd] = useState(kullanici.username ?? "");
  const [adMesaj, setAdMesaj] = useState<string | null>(null);
  const [adHata, setAdHata] = useState<string | null>(null);

  const [isletmeAd, setIsletmeAd] = useState(isletme.name);
  const [acilis, setAcilis] = useState(isletme.openTime);
  const [kapanis, setKapanis] = useState(isletme.closeTime);

  useEffect(() => {
    const z = window.setTimeout(() => setBildirim(null), 2600);
    return () => window.clearTimeout(z);
  }, [bildirim]);

  async function ayarKaydet(parca: Partial<Ayarlar>) {
    setKaydediyor(Object.keys(parca)[0] ?? "ayar");
    setAyarlar((o) => ({ ...o, ...parca }));
    try {
      const r = await fetch("/api/ayarlar", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parca),
      });
      const j = (await r.json().catch(() => ({}))) as Ayarlar & { hata?: string };
      if (!r.ok) {
        setBildirim(j.hata ?? t("genel.kaydedilemedi"));
        return;
      }
      setAyarlar(j);
      setBildirim(
        parca.dil ? (parca.dil === "en" ? "Saved." : "Kaydedildi.") : t("genel.kaydedildi"),
      );
      if (parca.tema) temaUygula(parca.tema);
      if (parca.dil) yonlendir.refresh();
    } catch {
      setBildirim(t("genel.baglantiYok"));
    } finally {
      setKaydediyor(null);
    }
  }

  async function kullaniciAdiKaydet(e: React.FormEvent) {
    e.preventDefault();
    setAdHata(null);
    setAdMesaj(null);
    try {
      const r = await fetch("/api/hesap/kullanici-adi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: ad }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; username?: string; hata?: string };
      if (!r.ok || !j.ok) {
        setAdHata(j.hata ?? t("genel.kaydedilemedi"));
        return;
      }
      setAd(j.username ?? ad);
      setAdMesaj(t("genel.kaydedildi"));
    } catch {
      setAdHata(t("genel.baglantiYok"));
    }
  }

  async function isletmeKaydet(e: React.FormEvent) {
    e.preventDefault();
    setKaydediyor("isletme");
    try {
      const r = await fetch("/api/business", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: isletmeAd, openTime: acilis, closeTime: kapanis }),
      });
      setBildirim(r.ok ? t("genel.kaydedildi") : t("genel.kaydedilemedi"));
    } catch {
      setBildirim(t("genel.baglantiYok"));
    } finally {
      setKaydediyor(null);
    }
  }

  async function tumCihazlardanCik() {
    if (!window.confirm(t("ayar.logoutAllConfirm"))) return;
    try {
      await fetch("/api/hesap/oturumlari-kapat", {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
    } finally {
      yonlendir.push("/giris?tumCihazlar=1");
    }
  }

  const tarih = (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat(dil === "en" ? "en-GB" : "tr-TR", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Europe/Istanbul",
        }).format(new Date(iso))
      : "—";

  return (
    <main className="kap py-5 sm:py-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {t("prof.account")}
          </p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight">{t("ayar.title")}</h1>
          <p className="mt-1 text-[13px] text-zinc-500">{t("ayar.sub")}</p>
        </div>
        <Link href="/profil" className="btn-sessiz h-9 text-[12.5px]">
          {t("ayar.profileSummary")}
        </Link>
      </div>

      {bildirim ? (
        <div
          role="status"
          className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-sm rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-center text-[12.5px] shadow-lg sm:bottom-6 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {bildirim}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
        <nav
          aria-label={t("ayar.title")}
          className="flex gap-1 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-2 lg:flex-col lg:overflow-visible dark:border-zinc-800 dark:bg-zinc-900"
        >
          {BOLUMLER.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBolum(b.id)}
              aria-current={bolum === b.id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] font-medium transition-colors ${
                bolum === b.id
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <span aria-hidden>{b.ikon}</span>
              {t(b.anahtar)}
            </button>
          ))}
        </nav>

        <div className="min-w-0 space-y-4">
          {bolum === "hesap" ? (
            <>
              <Kart baslik={t("ayar.profile")} aciklama={t("ayar.profileSub")}>
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-zinc-900 text-lg font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {(kullanici.email[0] ?? "?").toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold">@{kullanici.username ?? ad}</p>
                    <p className="truncate text-[12.5px] text-zinc-500">{kullanici.email}</p>
                  </div>
                </div>

                <form onSubmit={kullaniciAdiKaydet} className="mt-4 flex flex-wrap items-end gap-2">
                  <label className="min-w-[200px] flex-1 text-[12px] text-zinc-500">
                    {t("ayar.username")}
                    <input
                      value={ad}
                      onChange={(e) => setAd(e.target.value)}
                      className="giris mt-1 h-10 text-[13px]"
                      placeholder="hasan"
                    />
                  </label>
                  <button type="submit" className="btn-ikincil h-10 text-[12.5px]">
                    {t("genel.kaydet")}
                  </button>
                </form>
                {adHata ? <p className="mt-1 text-[12px] text-red-600">{adHata}</p> : null}
                {adMesaj ? <p className="mt-1 text-[12px] text-emerald-700">{adMesaj}</p> : null}
                <p className="mt-1 text-[11.5px] text-zinc-500">{t("ayar.usernameHint")}</p>
              </Kart>

              <Kart baslik={t("ayar.email")} aciklama={t("ayar.emailSub")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13px]">
                    {kullanici.email}{" "}
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-[11px] ${
                        kullanici.emailVerifiedAt
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
                      }`}
                    >
                      {kullanici.emailVerifiedAt ? t("ayar.verified") : t("ayar.unverified")}
                    </span>
                  </p>
                  {!kullanici.emailVerifiedAt ? (
                    <Link href="/eposta-dogrula" className="btn-birincil h-9 text-[12px]">
                      {t("auth.verifyLink")}
                    </Link>
                  ) : null}
                </div>

                <details className="mt-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
                  <summary className="cursor-pointer text-[12.5px] font-medium">
                    {t("ayar.changeEmail")}
                  </summary>
                  <KodAkisi
                    amac="eposta-degistir"
                    hedef="/ayarlar"
                    basariliMetni={t("genel.kaydedildi")}
                    basariliBaglanti={{ href: "/ayarlar", yazi: t("ayar.title") }}
                  />
                </details>
              </Kart>

              <Kart baslik={t("ayar.password")} aciklama={t("ayar.passwordSub")}>
                {sifreOk ? (
                  <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                    {t("genel.kaydedildi")}
                  </p>
                ) : null}
                {sifreHata ? (
                  <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                    {sifreHata}
                  </p>
                ) : null}
                <form action="/api/hesap/sifre" method="post" className="grid gap-2 sm:grid-cols-3">
                  <input type="hidden" name="donus" value="/ayarlar" />
                  <SifreAlani id="ay-mevcut" name="mevcut" label={t("ayar.currentPassword")} autoComplete="current-password" />
                  <SifreAlani id="ay-yeni" name="yeni" label={t("ayar.newPassword")} autoComplete="new-password" minLength={8} />
                  <SifreAlani id="ay-yeni-tekrar" name="yeniTekrar" label={t("ayar.newPasswordRepeat")} autoComplete="new-password" minLength={8} />
                  <button type="submit" className="btn-birincil h-10 text-[12.5px] sm:col-span-3 sm:justify-self-start">
                    {t("ayar.updatePassword")}
                  </button>
                </form>
              </Kart>
            </>
          ) : null}

          {bolum === "guvenlik" ? (
            <>
              <Kart
                baslik={t("ayar.twofa")}
                aciklama={t("ayar.twofaSub")}
                sag={
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                      ikiAdim.aktif
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {ikiAdim.aktif ? t("ayar.on") : t("ayar.off")}
                  </span>
                }
              >
                <p className="text-[12.5px] text-zinc-600 dark:text-zinc-300">
                  {ikiAdim.aktif
                    ? t("ayar.twofaOn", { n: ikiAdim.yedekKalan })
                    : t("ayar.twofaOff")}
                </p>
                <Link href="/profil/guvenlik" className="btn-ikincil mt-3 inline-flex h-9 text-[12.5px]">
                  {ikiAdim.aktif ? t("ayar.manage2fa") : t("ayar.enable2fa")}
                </Link>
              </Kart>

              <Kart baslik={t("ayar.sessions")} aciklama={t("ayar.sessionsSub")}>
                <div className="space-y-1 text-[12.5px] text-zinc-600 dark:text-zinc-300">
                  <p>
                    {t("ayar.lastLogin")}: <strong>{tarih(kullanici.lastLoginAt)}</strong>
                  </p>
                  <p>
                    {t("ayar.createdAt")}: <strong>{tarih(kullanici.createdAt)}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void tumCihazlardanCik()}
                  className="btn-tehlike mt-3 h-9 text-[12.5px]"
                >
                  {t("ayar.logoutAll")}
                </button>
              </Kart>
            </>
          ) : null}

          {bolum === "bildirimler" ? (
            <Kart baslik={t("ayar.notifTitle")} aciklama={t("ayar.notifSub")}>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <AyarSatiri
                  baslik={t("ayar.notifPublish")}
                  aciklama={t("ayar.notifPublishSub")}
                  acik={ayarlar.bildirimYayin}
                  mesgul={kaydediyor === "bildirimYayin"}
                  onChange={(v) => void ayarKaydet({ bildirimYayin: v })}
                />
                <AyarSatiri
                  baslik={t("ayar.notifLeave")}
                  aciklama={t("ayar.notifLeaveSub")}
                  acik={ayarlar.bildirimIzin}
                  mesgul={kaydediyor === "bildirimIzin"}
                  onChange={(v) => void ayarKaydet({ bildirimIzin: v })}
                />
                <AyarSatiri
                  baslik={t("ayar.notifSummary")}
                  aciklama={t("ayar.notifSummarySub")}
                  acik={ayarlar.bildirimOzet}
                  mesgul={kaydediyor === "bildirimOzet"}
                  onChange={(v) => void ayarKaydet({ bildirimOzet: v })}
                />
              </div>
              <p className="mt-3 text-[11.5px] text-zinc-500">{t("ayar.notifNote")}</p>
            </Kart>
          ) : null}

          {bolum === "gorunum" ? (
            <>
              <Kart baslik={t("ayar.theme")} aciklama={t("ayar.themeSub")}>
                <div className="grid gap-2 sm:grid-cols-3">
                  {([
                    { id: "sistem", ad: t("ayar.themeSystem"), alt: t("ayar.themeSystemSub") },
                    { id: "acik", ad: t("ayar.themeLight"), alt: t("ayar.themeLightSub") },
                    { id: "koyu", ad: t("ayar.themeDark"), alt: t("ayar.themeDarkSub") },
                  ] as { id: Tema; ad: string; alt: string }[]).map((tema) => (
                    <button
                      key={tema.id}
                      type="button"
                      onClick={() => void ayarKaydet({ tema: tema.id })}
                      aria-pressed={ayarlar.tema === tema.id}
                      className={`rounded-xl border p-3 text-left ${
                        ayarlar.tema === tema.id
                          ? "border-zinc-900 ring-1 ring-zinc-900 dark:border-zinc-100 dark:ring-zinc-100"
                          : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <span className="block text-[13px] font-medium">{tema.ad}</span>
                      <span className="block text-[11.5px] text-zinc-500">{tema.alt}</span>
                    </button>
                  ))}
                </div>
              </Kart>

              <Kart baslik={t("ayar.language")} aciklama={t("ayar.languageSub")}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {DILLER.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => void ayarKaydet({ dil: d.id as Dil })}
                      aria-pressed={ayarlar.dil === d.id}
                      className={`flex items-center justify-between rounded-xl border p-3 ${
                        ayarlar.dil === d.id
                          ? "border-zinc-900 ring-1 ring-zinc-900 dark:border-zinc-100 dark:ring-zinc-100"
                          : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <span className="text-[13px] font-medium">{d.ad}</span>
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {d.kisa}
                      </span>
                    </button>
                  ))}
                </div>
              </Kart>
            </>
          ) : null}

          {bolum === "isletme" ? (
            <Kart baslik={t("ayar.business")} aciklama={t("ayar.businessSub")}>
              <form onSubmit={isletmeKaydet} className="space-y-3">
                <label className="block text-[12px] text-zinc-500">
                  {t("ayar.businessName")}
                  <input
                    value={isletmeAd}
                    onChange={(e) => setIsletmeAd(e.target.value)}
                    className="giris mt-1 h-10 text-[13px]"
                    maxLength={80}
                    required
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-[12px] text-zinc-500">
                    {t("ayar.open")}
                    <input type="time" value={acilis} onChange={(e) => setAcilis(e.target.value)} className="giris mt-1 h-10 text-[13px]" />
                  </label>
                  <label className="block text-[12px] text-zinc-500">
                    {t("ayar.close")}
                    <input type="time" value={kapanis} onChange={(e) => setKapanis(e.target.value)} className="giris mt-1 h-10 text-[13px]" />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={acilis === kapanis || kaydediyor === "isletme"}
                  className="btn-birincil h-10 text-[12.5px] disabled:opacity-50"
                >
                  {t("genel.kaydet")}
                </button>
                {acilis === kapanis ? <p className="text-[12px] text-red-600">{t("ayar.sameHours")}</p> : null}
              </form>
              <p className="mt-3 text-[11.5px] text-zinc-500">{t("ayar.hoursNote")}</p>
            </Kart>
          ) : null}

          {bolum === "veri" ? (
            <>
              <Kart baslik={t("ayar.data")} aciklama={t("ayar.dataSub")}>
                <div className="flex flex-wrap gap-2">
                  <a href="/api/hesap/veri" className="btn-ikincil h-9 text-[12.5px]">
                    {t("ayar.download")}
                  </a>
                  <Link href="/gecmis" className="btn-sessiz h-9 text-[12.5px]">
                    {t("ayar.history3")}
                  </Link>
                  {sahip ? (
                    <Link href="/sql" className="btn-sessiz h-9 text-[12.5px]">
                      {t("ayar.sql")}
                    </Link>
                  ) : null}
                </div>
                <p className="mt-2 text-[11.5px] text-zinc-500">{t("ayar.dataNote")}</p>
              </Kart>

              <Kart baslik={t("ayar.privacy")} aciklama={t("ayar.privacySub")}>
                <div className="flex flex-wrap gap-2">
                  <Link href="/gizlilik" className="btn-sessiz h-9 text-[12.5px]">
                    {t("ayar.kvkk")}
                  </Link>
                  <Link href="/personel-aydinlatma" className="btn-sessiz h-9 text-[12.5px]">
                    {t("ayar.staffNotice")}
                  </Link>
                  <Link href="/yardim" className="btn-sessiz h-9 text-[12.5px]">
                    {t("ayar.help")}
                  </Link>
                </div>
              </Kart>

              <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 dark:border-red-500/30 dark:bg-red-500/5">
                <h2 className="text-[14px] font-semibold text-red-800 dark:text-red-200">
                  {t("ayar.danger")}
                </h2>
                <p className="mt-1 text-[12.5px] text-red-700/80 dark:text-red-200/80">
                  {t("ayar.dangerSub")}
                </p>
                <div className="mt-3">
                  <HesapSilButonu />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Kart({
  baslik,
  aciklama,
  sag,
  children,
}: {
  baslik: string;
  aciklama?: string;
  sag?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold tracking-tight">{baslik}</h2>
          {aciklama ? <p className="mt-0.5 text-[12px] text-zinc-500">{aciklama}</p> : null}
        </div>
        {sag}
      </div>
      {children}
    </section>
  );
}

function AyarSatiri({
  baslik,
  aciklama,
  acik,
  mesgul,
  onChange,
}: {
  baslik: string;
  aciklama: string;
  acik: boolean;
  mesgul: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-[13px] font-medium">{baslik}</p>
        <p className="text-[11.5px] text-zinc-500">{aciklama}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={acik}
        aria-label={baslik}
        disabled={mesgul}
        onClick={() => onChange(!acik)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          acik ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            acik ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
