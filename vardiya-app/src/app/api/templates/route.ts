import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { cleanText, isValidColor, normalizeTime } from "@/lib/validate";

// Yeni vardiya şablonu oluşturur
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = cleanText(body?.name, 30);
  const start = normalizeTime(body?.start);
  const end = normalizeTime(body?.end);
  const color = isValidColor(body?.color) ? String(body.color) : "sky";

  if (!name || !start || !end) {
    return NextResponse.json(
      { error: "Ad ve geçerli saat aralığı (SS:DD) gerekli" },
      { status: 400 }
    );
  }

  const business = await ensureBusiness();
  const minStaffRaw = Number(body?.minStaff);
  const minStaff = Number.isFinite(minStaffRaw) && minStaffRaw > 0 ? Math.round(minStaffRaw) : 0;

  const t = await prisma.shiftTemplate.create({
    data: { businessId: business.id, name, start, end, color, minStaff },
  });

  return NextResponse.json({
    id: t.id,
    name: t.name,
    start: t.start,
    end: t.end,
    color: t.color,
    minStaff: t.minStaff,
  });
}
