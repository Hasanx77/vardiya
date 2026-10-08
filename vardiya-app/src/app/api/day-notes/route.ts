import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { cleanText } from "@/lib/validate";

// Gün notu ekler/günceller; not boşsa siler
// body: { date, note }
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const date = String(body?.date ?? "");
  if (!date) {
    return NextResponse.json({ error: "date gerekli" }, { status: 400 });
  }

  const business = await ensureBusiness();
  const note = cleanText(body?.note, 300);

  if (!note) {
    await prisma.dayNote.deleteMany({ where: { businessId: business.id, date } });
    return NextResponse.json({ ok: true, removed: true });
  }

  const d = await prisma.dayNote.upsert({
    where: { businessId_date: { businessId: business.id, date } },
    update: { note },
    create: { businessId: business.id, date, note },
  });

  return NextResponse.json({ ok: true, date: d.date, note: d.note });
}
