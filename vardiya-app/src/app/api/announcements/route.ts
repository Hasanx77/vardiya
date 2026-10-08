import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { cleanText } from "@/lib/validate";

// Yeni duyuru yayınla
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const message = cleanText(body?.message, 400);
  if (!message) {
    return NextResponse.json({ error: "Mesaj gerekli" }, { status: 400 });
  }
  const business = await ensureBusiness();
  const a = await prisma.announcement.create({
    data: { businessId: business.id, message },
  });
  return NextResponse.json({ id: a.id, message: a.message, createdAt: a.createdAt.toISOString() });
}
