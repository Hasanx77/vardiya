import Link from "next/link";
import { redirect } from "next/navigation";
import { aktifKullanici } from "@/lib/auth";
import { ikiAdimDurumu } from "@/lib/iki-adim";
import GuvenlikClient from "./guvenlik-client";

export const metadata = {
  title: "Güvenlik — Vardiya",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Güvenlik ayarları: iki adımlı doğrulama. */
export default async function GuvenlikPage() {
  const kullanici = await aktifKullanici();
  if (!kullanici) redirect("/giris?next=%2Fprofil%2Fguvenlik");

  const durum = await ikiAdimDurumu(kullanici.id);

  return (
    <main className="flex-1">
      <div className="sayfa max-w-3xl">
        <Link
          href="/profil"
          className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 hover:text-zinc-600"
        >
          ← Profilim
        </Link>
        <h1 className="sayfa-baslik mt-1">Güvenlik</h1>
        <p className="sayfa-alt">
          Hesabını senin dışında kimse açamasın diye ikinci bir kapı ekle.
        </p>

        <GuvenlikClient baslangic={durum} />

        <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">İyi bilmen gerekenler</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              Yedek kodlar <strong>tek kullanımlıktır</strong>; biri kullanılınca listeden düşer.
            </li>
            <li>
              Telefonunu değiştireceksen önce yedek kodlarını yenile — yoksa hesaba giremezsin.
            </li>
            <li>
              Yedek kodları e-postayla göndermiyoruz; ekrandan kendin kaydetmen gerekiyor.
            </li>
            <li>
              Şifreni değiştirdiğinde diğer cihazlardaki oturumlar kapanır, bu koruma açık kalır.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
