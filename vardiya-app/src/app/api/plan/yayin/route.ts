import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { haftaBasiGecerliMi } from "@/lib/yayin";
import { gunEkleISO } from "@/lib/dates";
import { bildirimAcikMi } from "@/lib/ayarlar";
import { postaGonder } from "@/lib/mail";
import { yayinPostasi } from "@/lib/posta-sablonlari";

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

  // Bildirim açıksa sahibe kopya — yanıtı bekletmeden.
  after(async () => {
    try {
      if (!business.userId) return;
      if (!(await bildirimAcikMi(business.userId, "bildirimYayin"))) return;
      const sahip = await prisma.user.findUnique({
        where: { id: business.userId },
        select: { email: true },
      });
      if (!sahip?.email) return;

      const bitis = gunEkleISO(weekStart, 7);
      const [vardiya, kisiler] = await Promise.all([
        prisma.assignment.count({
          where: { businessId: business.id, date: { gte: weekStart, lt: bitis } },
        }),
        prisma.assignment.findMany({
          where: { businessId: business.id, date: { gte: weekStart, lt: bitis } },
          select: { employeeId: true },
          distinct: ["employeeId"],
        }),
      ]);

      const posta = yayinPostasi({
        isletme: business.name,
        hafta: weekStart,
        vardiya,
        kisi: kisiler.length,
      });
      await postaGonder({ kime: sahip.email, ...posta });
    } catch (e) {
      console.error("yayin bildirimi:", e instanceof Error ? e.message : e);
    }
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
