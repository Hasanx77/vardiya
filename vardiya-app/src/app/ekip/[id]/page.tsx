import { notFound } from "next/navigation";
import { getEkipPayload } from "@/lib/ekip";
import EkipDetayClient from "./ekip-detay-client";

export const metadata = {
  title: "Vardiya programı — Vardiya",
  // Kişisel program: arama motorlarına girmesin.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Personele gönderilen salt-okunur bağlantı.
 * Giriş gerektirmez; yalnızca o kişinin programını gösterir.
 */
export default async function EkipDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const veri = await getEkipPayload(id);
  if (!veri) notFound();

  return <EkipDetayClient veri={veri} />;
}
