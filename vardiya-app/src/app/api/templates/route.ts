import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { cleanText, isValidColor, normalizeTime } from "@/lib/validate";
import { araGecerliMi } from "@/lib/shifts";

// Yeni vardiya şablonu oluşturur
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = cleanText(body?.name, 30);
  const start = normalizeTime(body?.start);
  const end = normalizeTime(body?.end);
  const color = isValidColor(body?.color) ? String(body.color) : "sky";
  const breakStart = normalizeTime(body?.breakStart);
  const breakEnd = normalizeTime(body?.breakEnd);
  const araIstendi = Boolean(body?.breakStart || body?.breakEnd);

  if (!name || !start || !end) {
    return NextResponse.json(
      { error: "Ad ve geçerli saat aralığı (SS:DD) gerekli" },
      { status: 400 }
    );
  }
  if (start === end) {
    return NextResponse.json(
      { error: "Başlangıç ve bitiş saati aynı olamaz." },
      { status: 400 }
    );
  }
  if (araIstendi && !araGecerliMi(start, end, breakStart, breakEnd)) {
    return NextResponse.json(
      { error: "Ara saatleri vardiya içinde ve başlangıç < bitiş olacak şekilde girilmeli." },
      { status: 400 }
    );
  }

  const business = await ensureBusiness();
  const minStaffRaw = Number(body?.minStaff);
  const minStaff =
    Number.isFinite(minStaffRaw) && minStaffRaw > 0
      ? Math.min(999, Math.round(minStaffRaw))
      : 0;

  const t = await prisma.shiftTemplate.create({
    data: {
      businessId: business.id,
      name,
      start,
      end,
      color,
      minStaff,
      breakStart: araIstendi ? breakStart : null,
      breakEnd: araIstendi ? breakEnd : null,
    },
  });

  return NextResponse.json({
    id: t.id,
    name: t.name,
    start: t.start,
    end: t.end,
    breakStart: t.breakStart,
    breakEnd: t.breakEnd,
    color: t.color,
    minStaff: t.minStaff,
  });
}
