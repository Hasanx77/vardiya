import { notFound } from "next/navigation";
import { oturumGerekli } from "@/lib/oturum";
import { sahipMi } from "@/lib/visits";
import SqlPanel from "./sql-client";

export const metadata = {
  title: "SQL — Vardiya",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** SQL paneli — yalnızca site sahibi. */
export default async function SqlPage() {
  const kullanici = await oturumGerekli("/sql");
  if (!sahipMi(kullanici.email)) notFound();
  return <SqlPanel />;
}
