import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// Talebi onayla / reddet
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = ["approved", "rejected", "pending"].includes(body?.status)
    ? body.status
    : "pending";

  try {
    const req = await prisma.timeOffRequest.update({
      where: { id },
      data: { status },
    });

    // İzin onaylandıysa o günün vardiyasını kaldır
    if (status === "approved" && req.type === "izin") {
      await prisma.assignment.deleteMany({
        where: { employeeId: req.employeeId, date: req.date },
      });
    }

    return NextResponse.json({ ok: true, status: req.status });
  } catch {
    return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
  }
}
