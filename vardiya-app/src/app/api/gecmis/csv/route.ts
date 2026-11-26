import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { oturumGerekli } from "@/lib/oturum";
import { ensureBusiness } from "@/lib/server-data";
import { istanbulGunu } from "@/lib/dates";
import { shiftHours } from "@/lib/shifts";
import { csvMetni } from "@/lib/csv";

export const dynamic = "force-dynamic";

/** Son 3 ayın ay anahtarları. */
function sonAylar(adet = 3): string[] {
  const [y, m] = istanbulGunu().split("-").map(Number);
  const liste: string[] = [];
  for (let i = adet - 1; i >= 0; i--) {
    liste.push(new Date(Date.UTC(y, (m || 1) - 1 - i, 1)).toISOString().slice(0, 7));
  }
  return liste;
}

/** Son 3 ayın kişi × ay çalışma özeti — CSV. */
export async function GET() {
  await oturumGerekli("/gecmis");
  const business = await ensureBusiness();
  const aylar = sonAylar(3);

  const [personel, sablonlar, atamalar] = await Promise.all([
    prisma.employee.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
    prisma.shiftTemplate.findMany({
      where: { businessId: business.id },
      select: { id: true, start: true, end: true, breakStart: true, breakEnd: true },
    }),
    prisma.assignment.findMany({
      where: { businessId: business.id, date: { gte: `${aylar[0]}-01` } },
      select: { employeeId: true, date: true, shiftTemplateId: true },
    }),
  ]);

  const sablonById = new Map(sablonlar.map((s) => [s.id, s]));
  const harita = new Map<string, Map<string, { gun: number; saat: number }>>();
  for (const a of atamalar) {
    const s = sablonById.get(a.shiftTemplateId);
    if (!s) continue;
    const ay = a.date.slice(0, 7);
    const h = harita.get(a.employeeId) ?? new Map();
    const hucre = h.get(ay) ?? { gun: 0, saat: 0 };
    hucre.gun += 1;
    hucre.saat += shiftHours(s);
    h.set(ay, hucre);
    harita.set(a.employeeId, h);
  }

  const satirlar: (string | number)[][] = [
    ["Ay", "Personel", "Görev", "Gün", "Saat"],
  ];
  for (const p of personel) {
    for (const ay of aylar) {
      const h = harita.get(p.id)?.get(ay);
      if (!h || h.gun === 0) continue;
      satirlar.push([ay, p.name, p.role, h.gun, Math.round(h.saat * 10) / 10]);
    }
  }

  return new NextResponse(`\uFEFF${csvMetni(satirlar)}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="vardiya-gecmis-${aylar[0]}_${aylar[2]}.csv"`,
      "cache-control": "no-store",
    },
  });
}
