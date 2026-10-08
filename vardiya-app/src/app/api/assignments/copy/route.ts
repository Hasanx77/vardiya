import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { addDays, toISODate } from "@/lib/dates";

function weekDatesFrom(startISO: string): string[] {
  const [y, m, d] = startISO.split("-").map(Number);
  const base = new Date(y, (m ?? 1) - 1, d ?? 1);
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(base, i)));
}

// Bir haftanın vardiyalarını başka bir haftaya kopyalar (hedef hafta önce temizlenir)
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const from = String(body?.from ?? "");
  const to = String(body?.to ?? "");

  if (!from || !to) {
    return NextResponse.json({ error: "from ve to gerekli" }, { status: 400 });
  }

  const fromDates = weekDatesFrom(from);
  const toDates = weekDatesFrom(to);

  const business = await ensureBusiness();
  const src = await prisma.assignment.findMany({
    where: { businessId: business.id, date: { in: fromDates } },
  });

  // `${employeeId}|${günIndex}` -> shiftTemplateId
  const map = new Map<string, string>();
  for (const a of src) {
    const idx = fromDates.indexOf(a.date);
    if (idx >= 0) map.set(`${a.employeeId}|${idx}`, a.shiftTemplateId);
  }

  let copied = 0;
  await prisma.$transaction(async (tx) => {
    await tx.assignment.deleteMany({
      where: { businessId: business.id, date: { in: toDates } },
    });
    const rows = [...map.entries()].map(([key, shiftTemplateId]) => {
      const [employeeId, idxStr] = key.split("|");
      copied++;
      return {
        businessId: business.id,
        employeeId,
        date: toDates[Number(idxStr)],
        shiftTemplateId,
      };
    });
    if (rows.length) await tx.assignment.createMany({ data: rows });
  });

  return NextResponse.json({ ok: true, copied });
}
