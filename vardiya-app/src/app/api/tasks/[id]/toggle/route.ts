import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// Bir görevin belirli bir gündeki tamamlanma durumunu aç/kapa
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const date = String(body?.date ?? "");
  if (!date) {
    return NextResponse.json({ error: "date gerekli" }, { status: 400 });
  }

  const existing = await prisma.taskCompletion.findUnique({
    where: { taskId_date: { taskId: id, date } },
  });

  if (existing) {
    await prisma.taskCompletion.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, done: false });
  }

  await prisma.taskCompletion.create({ data: { taskId: id, date } });
  return NextResponse.json({ ok: true, done: true });
}
