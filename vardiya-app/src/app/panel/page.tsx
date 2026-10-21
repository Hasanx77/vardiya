import type { StatePayload } from "@/lib/types";
import { getStatePayload } from "@/lib/state";
import { oturumGerekli } from "@/lib/oturum";
import { sahipMi, ziyaretOzeti } from "@/lib/visits";
import PanelClient from "./panel-client";

// Veri her istekte taze gelsin (statik on-render edilmesin).
export const dynamic = "force-dynamic";

export default async function PanelPage() {
  // Site trafiği kartı yalnızca site sahibinde görünür.
  const kullanici = await oturumGerekli("/panel");
  const initialData: StatePayload = await getStatePayload();
  const ziyaret = sahipMi(kullanici.email) ? await ziyaretOzeti() : undefined;

  return <PanelClient initialData={initialData} ziyaret={ziyaret} />;
}
