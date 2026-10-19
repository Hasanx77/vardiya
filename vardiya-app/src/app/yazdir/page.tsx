import { getStatePayload } from "@/lib/state";
import YazdirClient from "./yazdir-client";

export const metadata = {
  title: "Yazdırılabilir çizelge — Vardiya",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function YazdirPage() {
  const data = await getStatePayload();
  return <YazdirClient initialData={data} />;
}
