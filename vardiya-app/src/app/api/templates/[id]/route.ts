import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanText, isValidColor, normalizeTime } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const data: Record<string, string> = {};
  const name = cleanText(body?.name, 30);
  const start = normalizeTime(body?.start);
  const end = normalizeTime(body?.end);
  if (name) data.name = name;
  if (start) data.start = start;
  if (end) data.end = end;
  if (isValidColor(body?.color)) data.color = String(body.color);

  try {
    const t = await prisma.shiftTemplate.update({ where: { id }, data });
    return NextResponse.json({
      id: t.id,
      name: t.name,
      start: t.start,
      end: t.end,
      color: t.color,
    });
  } catch {
    return NextResponse.json({ error: "Şablon bulunamadı" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    await prisma.shiftTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Şablon bulunamadı" }, { status: 404 });
  }
}
