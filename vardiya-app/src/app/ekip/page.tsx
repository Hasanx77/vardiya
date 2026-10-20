import type { StatePayload } from "@/lib/types";
import { getStatePayload } from "@/lib/state";
import { linkDurumu } from "@/lib/employee-link";
import EkipClient from "./ekip-client";

// Veri her istekte taze gelsin (statik on-render edilmesin).
export const dynamic = "force-dynamic";

export default async function EkipPage() {
  const initialData: StatePayload = await getStatePayload();

  // Personele özel bağlantılar imzalıdır; kapatılmışsa null döner.
  const baglantilar: Record<string, string | null> = {};
  await Promise.all(
    initialData.employees.map(async (e) => {
      const durum = await linkDurumu(e.id);
      baglantilar[e.id] = durum.aktif ? durum.yol : null;
    })
  );

  return <EkipClient initialData={initialData} baglantilar={baglantilar} />;
}
