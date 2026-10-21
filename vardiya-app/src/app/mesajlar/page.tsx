import Link from "next/link";
import { notFound } from "next/navigation";
import { oturumGerekli } from "@/lib/oturum";
import { mesajlariGetir, mesajlariOkunduYap } from "@/lib/messages";
import { sahipMi } from "@/lib/visits";

export const metadata = {
  title: "Gelen mesajlar — Vardiya",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const tarihSaat = (d: Date) =>
  d.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });

/**
 * İletişim formundan gelen mesajlar. Yalnızca site sahibi görebilir;
 * diğer hesaplar için sayfa 404 döner.
 */
export default async function MesajlarPage() {
  const kullanici = await oturumGerekli("/mesajlar");
  if (!sahipMi(kullanici.email)) notFound();

  const mesajlar = await mesajlariGetir();
  // Sahibi sayfayı açtı: okunmamışları okundu işaretle (liste zaten alındı).
  if (mesajlar.some((m) => !m.okundu)) await mesajlariOkunduYap();

  return (
    <main className="flex-1">
      <div className="sayfa max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
          Yönetim
        </p>
        <h1 className="sayfa-baslik mt-1">Gelen mesajlar</h1>
        <p className="sayfa-alt">
          İletişim formundan gelen talepler. Yalnızca site sahibi görebilir.
        </p>

        {mesajlar.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
            Henüz mesaj yok. Form{" "}
            <Link href="/iletisim" className="underline hover:text-zinc-900">
              /iletisim
            </Link>{" "}
            adresinde.
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {mesajlar.map((m) => (
              <li key={m.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-zinc-900">{m.ad}</span>{" "}
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent("Vardiya — mesajına yanıt")}`}
                      className="break-all text-sm text-amber-700 underline underline-offset-2"
                    >
                      {m.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    {!m.okundu ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                        yeni
                      </span>
                    ) : null}
                    <span className="text-xs text-zinc-500">{tarihSaat(m.createdAt)}</span>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                  {m.mesaj}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/profil" className="btn-ikincil">
            Profilim
          </Link>
          <Link href="/panel" className="btn-birincil">
            Panele git →
          </Link>
        </div>
      </div>
    </main>
  );
}
