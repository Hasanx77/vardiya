import { NextResponse } from "next/server";
import { getStatePayload } from "@/lib/state";

// Tüm uygulama durumu (işveren paneli + personel salt-okunur görünümü)
// Not: Aynı veri sunucu bileşenlerinde de kullanılır → lib/state.ts
export async function GET() {
  return NextResponse.json(await getStatePayload());
}
