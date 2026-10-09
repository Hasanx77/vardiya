import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { cleanText } from "@/lib/validate";

// Yeni günlük görev ekle
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const title = cleanText(body?.title, 120);
  if (!title) {
    return NextResponse.json({ error: "Başlık gerekli" }, { status: 400 });
  }
  const business = await ensureBusiness();
  const t = await prisma.task.create({ data: { businessId: business.id, title } });
  return NextResponse.json({ id: t.id, title: t.title });
}
