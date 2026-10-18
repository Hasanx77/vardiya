import type { StatePayload } from "@/lib/types";
import { getStatePayload } from "@/lib/state";
import TakvimClient from "./takvim-client";

// Veri her istekte taze gelsin (statik on-render edilmesin).
export const dynamic = "force-dynamic";

export default async function TakvimPage() {
  const initialData: StatePayload = await getStatePayload();
  return <TakvimClient initialData={initialData} />;
}
