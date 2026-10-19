import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { normalizeTime } from "@/lib/validate";

/**
 * İşletme ayarları: ad + **standart mesai saatleri**.
 * Bu saatler vardiya şablonlarının varsayılanı olarak kullanılır.
 */
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const business = await ensureBusiness();

  const data: { name?: string; openTime?: string; closeTime?: string } = {};

  if (body?.name !== undefined) {
    data.name = String(body.name ?? "").trim().slice(0, 80) || "İşletmem";
  }

  const acilis = normalizeTime(body?.openTime);
  const kapanis = normalizeTime(body?.closeTime);
  if (acilis) data.openTime = acilis;
  if (kapanis) data.closeTime = kapanis;

  // Açılış ve kapanış aynı olmasın (24 saatlik işletme için kapanış 23:59 kullanılır)
  const yeniAcilis = data.openTime ?? business.openTime;
  const yeniKapanis = data.closeTime ?? business.closeTime;
  if (yeniAcilis === yeniKapanis) {
    return NextResponse.json(
      { error: "Açılış ve kapanış saati aynı olamaz." },
      { status: 400 },
    );
  }

  const updated = await prisma.business.update({ where: { id: business.id }, data });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    openTime: updated.openTime,
    closeTime: updated.closeTime,
  });
}
