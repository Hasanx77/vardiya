import type { StatePayload } from "@/lib/types";
import { getStatePayload } from "@/lib/state";
import BugunClient from "./bugun-client";

// Veri her istekte taze gelsin (statik on-render edilmesin).
export const dynamic = "force-dynamic";

export default async function BugunPage() {
  const initialData: StatePayload = await getStatePayload();
  return <BugunClient initialData={initialData} />;
}
