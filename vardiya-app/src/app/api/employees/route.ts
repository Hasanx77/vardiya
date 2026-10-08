import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { nextColor } from "@/lib/colors";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Ad gerekli" }, { status: 400 });
  }

  const business = await ensureBusiness();
  const count = await prisma.employee.count({ where: { businessId: business.id } });
  const wageRaw = Number(body?.hourlyWage);
  const hourlyWage = Number.isFinite(wageRaw) && wageRaw >= 0 ? wageRaw : 0;

  const emp = await prisma.employee.create({
    data: {
      businessId: business.id,
      name: name.slice(0, 60),
      phone: String(body?.phone ?? "").trim().slice(0, 30),
      role: String(body?.role ?? "").trim().slice(0, 40) || "Personel",
      color: nextColor(count),
      hourlyWage,
    },
  });

  return NextResponse.json({
    id: emp.id,
    name: emp.name,
    phone: emp.phone,
    role: emp.role,
    color: emp.color,
    hourlyWage: emp.hourlyWage,
  });
}
