import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanText } from "@/lib/validate";

// Personel müsaitlik işareti ekler/kaldırır
// body: { employeeId, date, note?, remove? }
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const employeeId = String(body?.employeeId ?? "");
  const date = String(body?.date ?? "");

  if (!employeeId || !date) {
    return NextResponse.json({ error: "employeeId ve date gerekli" }, { status: 400 });
  }

  if (body?.remove) {
    await prisma.availability.deleteMany({ where: { employeeId, date } });
    return NextResponse.json({ ok: true, removed: true });
  }

  const note = cleanText(body?.note, 200);
  const a = await prisma.availability.upsert({
    where: { employeeId_date: { employeeId, date } },
    update: { note },
    create: { employeeId, date, note },
  });

  return NextResponse.json({ ok: true, employeeId: a.employeeId, date: a.date, note: a.note });
}
