import type { Metadata } from "next";
import DemoClient from "./demo-client";
import { kaydetZiyaret } from "@/lib/visits";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demo — Vardiya'yı kayıt olmadan dene",
  description:
    "Vardiya'nın haftalık plan ekranını kayıt olmadan dene. Hücrelere tıkla, 45 saat ve 11 saat dinlenme uyarılarını canlı gör.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "Demo — Vardiya'yı kayıt olmadan dene",
    description:
      "Örnek bir işletmenin haftalık vardiya planını incele; hücrelere tıklayarak vardiya değiştir.",
    url: "/demo",
    type: "website",
  },
};

export default async function DemoPage() {
  await kaydetZiyaret();
  return <DemoClient />;
}
