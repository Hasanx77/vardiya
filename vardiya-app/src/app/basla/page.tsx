import { oturumGerekli } from "@/lib/oturum";
import { ensureBusiness } from "@/lib/server-data";
import { epostadanAd } from "@/lib/kullanici-adi";
import { getStatePayload } from "@/lib/state";
import type { StatePayload } from "@/lib/types";
import BaslaClient from "./basla-client";
import Baslangic from "./baslangic";

// Veri her istekte taze gelsin (statik on-render edilmesin).
export const dynamic = "force-dynamic";

/**
 * Kayıttan sonraki ilk durak.
 *
 * Kullanıcı başlangıç adımlarını tamamlamadıysa **üç soruluk karşılama**
 * gösterilir; tamamladıysa normal "başla" ekranı.
 */
export default async function BaslaPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string }>;
}) {
  const kullanici = await oturumGerekli("/basla");
  const { hata } = await searchParams;
  await ensureBusiness();

  if (!kullanici.onboardedAt) {
    return (
      <Baslangic
        varsayilanAd={kullanici.username ?? epostadanAd(kullanici.email)}
        hata={hata}
      />
    );
  }

  const initialData: StatePayload = await getStatePayload();
  return <BaslaClient initialData={initialData} />;
}
