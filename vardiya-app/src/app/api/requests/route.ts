import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Personel izin / vardiya değişimi talebi oluşturur
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const employeeId = String(body?.employeeId ?? "");
  const date = String(body?.date ?? "");
  const type = body?.type === "degisim" ? "degisim" : "izin";
  const note = String(body?.note ?? "").slice(0, 300);

  if (!employeeId || !date) {
    return NextResponse.json({ error: "employeeId ve date gerekli" }, { status: 400 });
  }

  const req = await prisma.timeOffRequest.create({
    data: { employeeId, date, type, note },
  });

  return NextResponse.json({ id: req.id, status: req.status });
}
