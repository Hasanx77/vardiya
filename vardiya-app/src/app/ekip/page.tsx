import type { StatePayload } from "@/lib/types";
import { getStatePayload } from "@/lib/state";
import EkipClient from "./ekip-client";

// Veri her istekte taze gelsin (statik on-render edilmesin).
export const dynamic = "force-dynamic";

export default async function EkipPage() {
  const initialData: StatePayload = await getStatePayload();
  return <EkipClient initialData={initialData} />;
}
