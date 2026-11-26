import { oturumGerekli } from "@/lib/oturum";
import { ensureBusiness } from "@/lib/server-data";
import { ayarlariAl } from "@/lib/ayarlar";
import { ikiAdimDurumu } from "@/lib/iki-adim";
import { sahipMi } from "@/lib/visits";
import AyarlarClient from "./ayarlar-client";

export const metadata = {
  title: "Ayarlar — Vardiya",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Ayarlar — hesap, güvenlik, bildirim, görünüm, işletme ve veri. */
export default async function AyarlarPage({
  searchParams,
}: {
  searchParams: Promise<{ sifreOk?: string; sifreHata?: string }>;
}) {
  const kullanici = await oturumGerekli("/ayarlar");
  const isletme = await ensureBusiness();
  const [ayarlar, ikiAdim, sp] = await Promise.all([
    ayarlariAl(kullanici.id),
    ikiAdimDurumu(kullanici.id).catch(() => ({ aktif: false, yedekKalan: 0 })),
    searchParams,
  ]);

  return (
    <AyarlarClient
      kullanici={{
        email: kullanici.email,
        username: kullanici.username,
        createdAt: kullanici.createdAt.toISOString(),
        lastLoginAt: kullanici.lastLoginAt?.toISOString() ?? null,
        emailVerifiedAt: kullanici.emailVerifiedAt?.toISOString() ?? null,
      }}
      isletme={{ name: isletme.name, openTime: isletme.openTime, closeTime: isletme.closeTime }}
      ayarlar={ayarlar}
      ikiAdim={ikiAdim}
      sahip={sahipMi(kullanici.email)}
      sifreOk={sp.sifreOk === "1"}
      sifreHata={sp.sifreHata}
    />
  );
}
