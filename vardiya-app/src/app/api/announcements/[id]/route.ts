import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";

type Ctx = { params: Promise<{ id: string }> };

/** Duyuru sil. 🔒 Yalnızca kendi işletmenin duyurusu silinebilir. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const business = await ensureBusiness();

  const sonuc = await prisma.announcement.deleteMany({
    where: { id, businessId: business.id },
  });
  if (sonuc.count === 0) {
    return NextResponse.json({ error: "Duyuru bulunamadı" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
