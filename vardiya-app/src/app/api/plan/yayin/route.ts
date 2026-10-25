import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { haftaBasiGecerliMi } from "@/lib/yayin";

/**
 * Haftalık plan yayını.
 *
 * POST   { weekStart } → haftayı yayınlar (personel linki + .ics görür)
 * DELETE { weekStart } → yayını geri alır (hafta yeniden taslak olur)
 *
 * 🔒 Oturum + işletme sahipliği: `ensureBusiness()` oturumdaki kullanıcının
 * işletmesini döner; başka bir işletmenin haftası üzerinde işlem yapılamaz.
 */
function haftaOku(body: unknown, url: URL): string {
  const b = (body ?? {}) as { weekStart?: unknown; week?: unknown };
  return String(b.weekStart ?? b.week ?? url.searchParams.get("weekStart") ?? "").trim();
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const weekStart = haftaOku(body, url);

  if (!haftaBasiGecerliMi(weekStart)) {
    return NextResponse.json(
      { error: "weekStart pazartesi günü ve YYYY-MM-DD biçiminde olmalı" },
      { status: 400 }
    );
  }

  const business = await ensureBusiness();

  const kayit = await prisma.weekPlan.upsert({
    where: { businessId_weekStart: { businessId: business.id, weekStart } },
    update: { publishedAt: new Date() },
    create: { businessId: business.id, weekStart },
  });

  return NextResponse.json({
    ok: true,
    weekStart: kayit.weekStart,
    publishedAt: kayit.publishedAt.toISOString(),
  });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const weekStart = haftaOku(body, url);

  if (!haftaBasiGecerliMi(weekStart)) {
    return NextResponse.json(
      { error: "weekStart pazartesi günü ve YYYY-MM-DD biçiminde olmalı" },
      { status: 400 }
    );
  }

  const business = await ensureBusiness();
  await prisma.weekPlan.deleteMany({ where: { businessId: business.id, weekStart } });

  return NextResponse.json({ ok: true, weekStart });
}
