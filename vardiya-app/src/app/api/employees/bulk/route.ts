import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { nextColor } from "@/lib/colors";
import { cleanText } from "@/lib/validate";

type IncomingEmployee = { name?: unknown; role?: unknown; phone?: unknown };

// Kurulum sihirbazı için: birden fazla personeli tek istekte ekler
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const list: IncomingEmployee[] = Array.isArray(body?.employees) ? body.employees : [];

  if (list.length === 0) {
    return NextResponse.json({ error: "employees gerekli" }, { status: 400 });
  }

  const business = await ensureBusiness();
  const startCount = await prisma.employee.count({ where: { businessId: business.id } });

  const data = list
    .slice(0, 200)
    .map((e, i) => ({
      businessId: business.id,
      name: cleanText(e?.name, 60),
      phone: cleanText(e?.phone, 30),
      role: cleanText(e?.role, 40) || "Personel",
      color: nextColor(startCount + i),
    }))
    .filter((e) => e.name.length > 0);

  if (data.length === 0) {
    return NextResponse.json({ error: "Geçerli personel yok" }, { status: 400 });
  }

  await prisma.employee.createMany({ data });
  return NextResponse.json({ ok: true, created: data.length });
}
