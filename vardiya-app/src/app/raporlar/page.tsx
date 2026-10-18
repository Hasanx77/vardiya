import type { StatePayload } from "@/lib/types";
import { getStatePayload } from "@/lib/state";
import RaporlarClient from "./raporlar-client";

// Veri her istekte taze gelsin (statik on-render edilmesin).
export const dynamic = "force-dynamic";

export default async function RaporlarPage() {
  const initialData: StatePayload = await getStatePayload();
  return <RaporlarClient initialData={initialData} />;
}
