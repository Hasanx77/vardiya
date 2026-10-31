import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness, seedDemoData } from "@/lib/server-data";
import { okunduSil } from "@/lib/okundu-db";

// Tüm personel/vardiya/talepleri siler.
// mode: "demo" -> örnek veriyi yeniden yükler, "empty" -> boş bırakır
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const mode = body?.mode === "demo" ? "demo" : "empty";

  const business = await ensureBusiness();

  await prisma.assignment.deleteMany({ where: { businessId: business.id } });
  await prisma.employee.deleteMany({ where: { businessId: business.id } });
  await prisma.announcement.deleteMany({ where: { businessId: business.id } });
  await prisma.dayNote.deleteMany({ where: { businessId: business.id } });
  // Yayın durumu da sıfırlanır: yeni plan taslak olarak başlar.
  await prisma.weekPlan.deleteMany({ where: { businessId: business.id } });
  // İzin/mazeret talepleri (ham SQL tablo) da sıfırlanır.
  await prisma.$executeRawUnsafe(`DELETE FROM "IzinTalebi" WHERE "businessId" = ?`, business.id);
  // Okundu kayıtları (ham SQL tablo) da sıfırlanır — yeni plan temiz başlar.
  await okunduSil(business.id);

  if (mode === "demo") {
    await seedDemoData(business.id);
  }

  return NextResponse.json({ ok: true, mode });
}
