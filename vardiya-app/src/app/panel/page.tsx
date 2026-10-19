import type { StatePayload } from "@/lib/types";
import { getStatePayload } from "@/lib/state";
import { aktifKullanici } from "@/lib/auth";
import { sahipMi, ziyaretOzeti } from "@/lib/visits";
import PanelClient from "./panel-client";

// Veri her istekte taze gelsin (statik on-render edilmesin).
export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const initialData: StatePayload = await getStatePayload();

  // Site trafiği kartı yalnızca site sahibinde görünür.
  const kullanici = await aktifKullanici();
  const ziyaret = sahipMi(kullanici?.email) ? await ziyaretOzeti() : undefined;

  return <PanelClient initialData={initialData} ziyaret={ziyaret} />;
}
