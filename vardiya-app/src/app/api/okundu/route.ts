import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { haftaBasiGecerliMi } from "@/lib/yayin";
import { okunduGorenlerCoklu } from "@/lib/okundu-db";
import { okunduOzeti, type OkunduKart, type OkunduYaniti } from "@/lib/okundu";

/**
 * Panel — "kim gördü?" özeti.
 *
 * `GET /api/okundu?hafta=YYYY-MM-DD`
 *
 * Dönen: haftanın yayın durumu + planı kaç kişinin gördüğü (görmeyenlerin
 * adlarıyla) + son 3 duyurunun okunma sayısı.
 *
 * 🔒 Oturum + işletme sahipliği: `ensureBusiness()` yalnızca kullanıcının
 * kendi işletmesini döner; başka hesabın verisi sorulamaz.
 * Kişisel veri yok: yalnızca "gördü/görmedi" bilgisi.
 */
export async function GET(req: Request) {
  const business = await ensureBusiness();
  const hafta = new URL(req.url).searchParams.get("hafta") ?? "";

  if (!haftaBasiGecerliMi(hafta)) {
    return NextResponse.json(
      { hata: "Hafta başlangıcı geçersiz (pazartesi, YYYY-MM-DD olmalı)." },
      { status: 400 },
    );
  }

  const [personel, yayin, duyurular] = await Promise.all([
    prisma.employee.findMany({
      where: { businessId: business.id, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.weekPlan.findUnique({
      where: { businessId_weekStart: { businessId: business.id, weekStart: hafta } },
      select: { weekStart: true },
    }),
    prisma.announcement.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, message: true, createdAt: true },
    }),
  ]);

  const adlar = new Map(personel.map((p) => [p.id, p.name]));
  const idler = personel.map((p) => p.id);

  const [planGorenler, duyuruGorenler] = await Promise.all([
    // Taslak haftada okundu bilgisi sorulmaz: kimseye gösterilmedi.
    yayin ? okunduGorenlerCoklu(business.id, "plan", [hafta]) : new Map<string, string[]>(),
    okunduGorenlerCoklu(business.id, "duyuru", duyurular.map((d) => d.id)),
  ]);

  function kart(gorenler: readonly string[]): OkunduKart {
    const ozet = okunduOzeti(idler, gorenler);
    return {
      toplam: ozet.toplam,
      goren: ozet.goren,
      oran: ozet.oran,
      gormeyenAdlar: ozet.gormeyen.map((id) => adlar.get(id) ?? "Bilinmeyen personel"),
    };
  }

  const yanit: OkunduYaniti = {
    hafta,
    yayinda: Boolean(yayin),
    plan: kart(planGorenler.get(hafta) ?? []),
    duyurular: duyurular.map((d) => ({
      id: d.id,
      message: d.message,
      createdAt: d.createdAt.toISOString(),
      ozet: kart(duyuruGorenler.get(d.id) ?? []),
    })),
  };

  return NextResponse.json(yanit, { headers: { "Cache-Control": "no-store" } });
}
