import type { StatePayload } from "@/lib/types";
import { getStatePayload } from "@/lib/state";
import BaslaClient from "./basla-client";

// Veri her istekte taze gelsin (statik on-render edilmesin).
export const dynamic = "force-dynamic";

export default async function BaslaPage() {
  const initialData: StatePayload = await getStatePayload();
  return <BaslaClient initialData={initialData} />;
}
