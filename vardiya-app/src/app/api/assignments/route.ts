import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";

// Atama ekler/günceller ya da (shiftTemplateId boşsa) siler.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const employeeId = String(body?.employeeId ?? "");
  const date = String(body?.date ?? "");
  const shiftTemplateId = body?.shiftTemplateId ? String(body.shiftTemplateId) : "";

  if (!employeeId || !date) {
    return NextResponse.json({ error: "employeeId ve date gerekli" }, { status: 400 });
  }

  // Boş atama => mevcut kaydı sil
  if (!shiftTemplateId) {
    await prisma.assignment.deleteMany({ where: { employeeId, date } });
    return NextResponse.json({ ok: true, deleted: true });
  }

  const business = await ensureBusiness();

  await prisma.assignment.upsert({
    where: { employeeId_date: { employeeId, date } },
    update: { shiftTemplateId },
    create: { businessId: business.id, employeeId, date, shiftTemplateId },
  });

  return NextResponse.json({ ok: true });
}
