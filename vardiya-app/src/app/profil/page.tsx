import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/auth";
import { getStatePayload } from "@/lib/state";
import HesapSilButonu from "@/components/HesapSilButonu";
import { mesajOzeti } from "@/lib/messages";
import { sahipMi } from "@/lib/visits";

export const metadata = {
  title: "Profilim — Vardiya",
  robots: { index: false, follow: false },
};

const tarih = (d: Date | null) =>
  d ? d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "—";

const tarihSaat = (d: Date | null) =>
  d
    ? d.toLocaleString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

/** Profil: hesap bilgileri, özet, şifre değiştirme ve gizlilik işlemleri. */
export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ sifreOk?: string; sifreHata?: string }>;
}) {
  const kullanici = await aktifKullanici();
  if (!kullanici) redirect("/giris?next=%2Fprofil");

  const { sifreOk, sifreHata } = await searchParams;

  const durum = await getStatePayload();
  const toplamVardiya = await prisma.assignment.count({
    where: { businessId: durum.business.id },
  });
  const sahip = sahipMi(kullanici.email);
  const mesajlar = sahip ? await mesajOzeti() : null;

  return (
    <main className="flex-1">
      <div className="sayfa max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
          Hesap
        </p>
        <h1 className="sayfa-baslik mt-1">Profilim</h1>
        <p className="sayfa-alt">
          Hesabına ait bilgiler. Bu veriler yalnızca sana görünür.
        </p>

        {/* Hesap bilgileri */}
        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-zinc-900 text-lg font-semibold text-white">
              {(kullanici.email[0] ?? "?").toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold">{kullanici.email}</div>
              <div className="text-sm text-zinc-500">
                {durum.business.name} · işletme sahibi
              </div>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Kayıt tarihi</dt>
              <dd className="font-medium">{tarih(kullanici.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Son giriş</dt>
              <dd className="font-medium">{tarihSaat(kullanici.lastLoginAt)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Hesap kimliği</dt>
              <dd className="truncate font-mono text-xs text-zinc-500">{kullanici.id}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Şifre</dt>
              <dd className="font-medium">Şifrelenmiş (hash) olarak saklanır</dd>
            </div>
          </dl>
        </section>

        {/* İşletme özeti */}
        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-zinc-500">Personel</div>
            <div className="mt-1 text-2xl font-semibold">{durum.employees.length}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-zinc-500">Vardiya şablonu</div>
            <div className="mt-1 text-2xl font-semibold">{durum.shiftTemplates.length}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-zinc-500">Toplam atanmış vardiya</div>
            <div className="mt-1 text-2xl font-semibold">{toplamVardiya}</div>
          </div>
        </section>

        {mesajlar ? (
          <section className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-sm font-semibold">İletişim mesajları</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Toplam <strong>{mesajlar.toplam}</strong> mesaj
                {mesajlar.okunmamis > 0 ? (
                  <>
                    {" · "}
                    <span className="font-semibold text-amber-700">
                      {mesajlar.okunmamis} yeni
                    </span>
                  </>
                ) : null}
              </p>
            </div>
            <Link href="/mesajlar" prefetch={false} className="btn-ikincil">
              Gelen mesajlar
            </Link>
          </section>
        ) : null}

        {/* Şifre değiştir */}
        <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Şifre değiştir</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Güvenli bir şifre seç: en az 8 karakter, tahmin edilmesi zor.
          </p>

          {sifreOk ? (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Şifren güncellendi.
            </p>
          ) : null}
          {sifreHata ? (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {sifreHata}
            </p>
          ) : null}

          <form action="/api/hesap/sifre" method="post" className="mt-4 grid gap-3 sm:grid-cols-3">
            <input
              type="password"
              name="mevcut"
              required
              autoComplete="current-password"
              placeholder="Mevcut şifre"
              aria-label="Mevcut şifre"
              className="giris"
            />
            <input
              type="password"
              name="yeni"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Yeni şifre"
              aria-label="Yeni şifre"
              className="giris"
            />
            <input
              type="password"
              name="yeniTekrar"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Yeni şifre (tekrar)"
              aria-label="Yeni şifre tekrar"
              className="giris"
            />
            <button
              type="submit"
              className="btn-birincil sm:col-span-3 sm:justify-self-start"
            >
              Şifremi güncelle
            </button>
          </form>
        </section>

        {/* Verilerim */}
        <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Verilerim</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Verilerini indirebilir ya da hesabını ve tüm kayıtları kalıcı olarak silebilirsin.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/api/hesap/veri"
              className="btn-ikincil"
            >
              Verilerimi indir (JSON)
            </a>
            <HesapSilButonu />
          </div>
        </section>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/panel"
            className="btn-birincil"
          >
            Panele git →
          </Link>
          <Link
            href="/gizlilik"
            className="btn-ikincil"
          >
            Gizlilik aydınlatması
          </Link>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="btn-tehlike"
            >
              Çıkış yap
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
