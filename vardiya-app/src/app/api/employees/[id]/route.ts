import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Personel güncelle / sil.
 *
 * 🔒 Güvenlik: kayıt, oturumdaki kullanıcının işletmesine ait değilse işlem yapılmaz
 * (`where` içinde businessId de aranır). Böylece başka bir hesabın personeli
 * kimlik numarası bilinse bile düzenlenemez/silinemez.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const business = await ensureBusiness();
  const body = await request.json().catch(() => ({}));

  const data: Record<string, string | number> = {};
  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim().slice(0, 60);
  if (typeof body?.phone === "string") data.phone = body.phone.trim().slice(0, 30);
  if (typeof body?.role === "string") data.role = body.role.trim().slice(0, 40) || "Personel";
  if (body?.annualLeaveDays !== undefined) {
    const leave = Number(body.annualLeaveDays);
    if (Number.isFinite(leave) && leave >= 0) data.annualLeaveDays = Math.round(leave);
  }

  const sonuc = await prisma.employee.updateMany({
    where: { id, businessId: business.id },
    data,
  });
  if (sonuc.count === 0) {
    return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 });
  }

  const emp = await prisma.employee.findUnique({ where: { id } });
  return NextResponse.json({
    id: emp?.id,
    name: emp?.name,
    phone: emp?.phone,
    role: emp?.role,
    color: emp?.color,
    annualLeaveDays: emp?.annualLeaveDays,
  });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const business = await ensureBusiness();

  const sonuc = await prisma.employee.deleteMany({ where: { id, businessId: business.id } });
  if (sonuc.count === 0) {
    return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
