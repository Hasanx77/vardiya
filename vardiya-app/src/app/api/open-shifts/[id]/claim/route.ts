import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// Açık vardiyayı bir personel sahiplenir
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const employeeId = String(body?.employeeId ?? "");
  if (!employeeId) {
    return NextResponse.json({ error: "employeeId gerekli" }, { status: 400 });
  }

  const open = await prisma.openShift.findUnique({ where: { id } });
  if (!open) {
    return NextResponse.json({ error: "Açık vardiya bulunamadı" }, { status: 404 });
  }

  // Personelin o gün başka vardiyası varsa kaldır, sonra bu vardiyayı ata
  await prisma.assignment.deleteMany({
    where: { employeeId, date: open.date },
  });
  await prisma.assignment.create({
    data: {
      businessId: open.businessId,
      employeeId,
      date: open.date,
      shiftTemplateId: open.shiftTemplateId,
    },
  });
  await prisma.openShift.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
