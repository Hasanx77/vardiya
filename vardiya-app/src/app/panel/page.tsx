import type { StatePayload } from "@/lib/types";
import { getStatePayload } from "@/lib/state";
import PanelClient from "./panel-client";

// Veri her istekte taze gelsin (statik on-render edilmesin).
export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const initialData: StatePayload = await getStatePayload();
  return <PanelClient initialData={initialData} />;
}
