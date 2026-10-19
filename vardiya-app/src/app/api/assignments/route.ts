import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";

/**
 * Atama ekler/günceller ya da (shiftTemplateId boşsa) siler.
 *
 * 🔒 Güvenlik: personel ve şablon **oturumdaki kullanıcının işletmesine ait** olmalı.
 * Aksi halde başka bir hesabın kaydı üzerinde işlem yapılabilirdi.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const employeeId = String(body?.employeeId ?? "");
  const date = String(body?.date ?? "");
  const shiftTemplateId = body?.shiftTemplateId ? String(body.shiftTemplateId) : "";

  if (!employeeId || !date) {
    return NextResponse.json({ error: "employeeId ve date gerekli" }, { status: 400 });
  }

  const business = await ensureBusiness();

  // Personel gerçekten bu işletmeye mi ait?
  const personel = await prisma.employee.findFirst({
    where: { id: employeeId, businessId: business.id },
    select: { id: true },
  });
  if (!personel) {
    return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 });
  }

  // Boş atama => mevcut kaydı sil (yalnızca kendi işletmemde)
  if (!shiftTemplateId) {
    await prisma.assignment.deleteMany({ where: { employeeId, date, businessId: business.id } });
    return NextResponse.json({ ok: true, deleted: true });
  }

  // Şablon da bu işletmeye ait olmalı
  const sablon = await prisma.shiftTemplate.findFirst({
    where: { id: shiftTemplateId, businessId: business.id },
    select: { id: true },
  });
  if (!sablon) {
    return NextResponse.json({ error: "Vardiya şablonu bulunamadı" }, { status: 404 });
  }

  await prisma.assignment.upsert({
    where: { employeeId_date: { employeeId, date } },
    update: { shiftTemplateId },
    create: { businessId: business.id, employeeId, date, shiftTemplateId },
  });

  return NextResponse.json({ ok: true });
}
