import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { nextColor } from "@/lib/colors";
import { sinirliTamSayi } from "@/lib/validate";

/**
 * Yeni personel ekle.
 * Not: Saatlik ücret/maliyet bilgisi **toplanmaz** (ürün yalnızca vardiya planlar).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Ad gerekli" }, { status: 400 });
  }

  const business = await ensureBusiness();
  const count = await prisma.employee.count({ where: { businessId: business.id } });
  // İzin hakkı 0–365 gün aralığında tutulur (mantıksız değerler reddedilmez,
  // en yakın geçerli değere çekilir).
  const annualLeaveDays = sinirliTamSayi(body?.annualLeaveDays, 0, 365, 14);

  const emp = await prisma.employee.create({
    data: {
      businessId: business.id,
      name: name.slice(0, 60),
      phone: String(body?.phone ?? "").trim().slice(0, 30),
      role: String(body?.role ?? "").trim().slice(0, 40) || "Personel",
      color: nextColor(count),
      annualLeaveDays,
    },
  });

  return NextResponse.json({
    id: emp.id,
    name: emp.name,
    phone: emp.phone,
    role: emp.role,
    color: emp.color,
    annualLeaveDays: emp.annualLeaveDays,
  });
}
