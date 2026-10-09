import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { cleanText } from "@/lib/validate";

// Açık vardiya (havuz) oluştur
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const date = String(body?.date ?? "");
  const shiftTemplateId = String(body?.shiftTemplateId ?? "");

  if (!date || !shiftTemplateId) {
    return NextResponse.json({ error: "date ve shiftTemplateId gerekli" }, { status: 400 });
  }

  const business = await ensureBusiness();
  const o = await prisma.openShift.create({
    data: {
      businessId: business.id,
      date,
      shiftTemplateId,
      note: cleanText(body?.note, 200),
    },
  });

  return NextResponse.json({
    id: o.id,
    date: o.date,
    shiftTemplateId: o.shiftTemplateId,
    note: o.note,
  });
}
