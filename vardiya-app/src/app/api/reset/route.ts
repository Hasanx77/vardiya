import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness, seedDemoData } from "@/lib/server-data";

// Tüm personel/vardiya/talepleri siler.
// mode: "demo" -> örnek veriyi yeniden yükler, "empty" -> boş bırakır
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const mode = body?.mode === "demo" ? "demo" : "empty";

  const business = await ensureBusiness();

  await prisma.assignment.deleteMany({ where: { businessId: business.id } });
  await prisma.employee.deleteMany({ where: { businessId: business.id } });

  if (mode === "demo") {
    await seedDemoData(business.id);
  }

  return NextResponse.json({ ok: true, mode });
}
