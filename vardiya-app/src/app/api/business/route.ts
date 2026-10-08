import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const business = await ensureBusiness();
  const name = String(body?.name ?? "").trim().slice(0, 80) || "İşletmem";

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: { name },
  });

  return NextResponse.json({ id: updated.id, name: updated.name });
}
