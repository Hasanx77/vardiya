import { NextResponse } from "next/server";
import { getEkipPayload } from "@/lib/ekip";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Personelin salt-okunur programı (giriş gerektirmez).
 * Yalnızca o personele ait alanları döner; telefon ve diğer personel yoktur.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const veri = await getEkipPayload(id);
  if (!veri) {
    return NextResponse.json({ hata: "Personel bulunamadı" }, { status: 404 });
  }
  return NextResponse.json(veri, {
    headers: { "Cache-Control": "no-store" },
  });
}
