import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const data: Record<string, string> = {};
  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim().slice(0, 60);
  if (typeof body?.phone === "string") data.phone = body.phone.trim().slice(0, 30);
  if (typeof body?.role === "string") data.role = body.role.trim().slice(0, 40) || "Personel";

  try {
    const emp = await prisma.employee.update({ where: { id }, data });
    return NextResponse.json({
      id: emp.id,
      name: emp.name,
      phone: emp.phone,
      role: emp.role,
      color: emp.color,
    });
  } catch {
    return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 });
  }
}
