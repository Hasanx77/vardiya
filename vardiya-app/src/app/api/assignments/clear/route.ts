import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { addDays, toISODate } from "@/lib/dates";

function weekDatesFrom(startISO: string): string[] {
  const [y, m, d] = startISO.split("-").map(Number);
  const base = new Date(y, (m ?? 1) - 1, d ?? 1);
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(base, i)));
}

// Bir haftanın tüm vardiyalarını siler
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const week = String(body?.week ?? "");
  if (!week) {
    return NextResponse.json({ error: "week gerekli" }, { status: 400 });
  }

  const business = await ensureBusiness();
  const dates = weekDatesFrom(week);
  const result = await prisma.assignment.deleteMany({
    where: { businessId: business.id, date: { in: dates } },
  });

  return NextResponse.json({ ok: true, deleted: result.count });
}
