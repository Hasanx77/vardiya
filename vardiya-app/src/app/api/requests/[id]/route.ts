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

    if (status === "approved") {
      if (req.type === "izin") {
        // İzin onaylandı → o günün vardiyasını kaldır
        await prisma.assignment.deleteMany({
          where: { employeeId: req.employeeId, date: req.date },
        });
      } else if (req.type === "degisim" && req.targetEmployeeId) {
        // Vardiya değişimi onaylandı → iki personelin o günkü vardiyalarını takas et
        const [mine, theirs] = await Promise.all([
          prisma.assignment.findFirst({
            where: { employeeId: req.employeeId, date: req.date },
          }),
          prisma.assignment.findFirst({
            where: { employeeId: req.targetEmployeeId, date: req.date },
          }),
        ]);

        await prisma.assignment.deleteMany({
          where: {
            date: req.date,
            employeeId: { in: [req.employeeId, req.targetEmployeeId] },
          },
        });

        const rows: {
          businessId: string;
          employeeId: string;
          date: string;
          shiftTemplateId: string;
        }[] = [];
        // Karşı tarafın vardiyası bana
        if (theirs) {
          rows.push({
            businessId: theirs.businessId,
            employeeId: req.employeeId,
            date: req.date,
            shiftTemplateId: theirs.shiftTemplateId,
          });
        }
        // Benim vardiyam karşı tarafa
        if (mine) {
          rows.push({
            businessId: mine.businessId,
            employeeId: req.targetEmployeeId,
            date: req.date,
            shiftTemplateId: mine.shiftTemplateId,
          });
        }
        if (rows.length) await prisma.assignment.createMany({ data: rows });
      }
    }

    return NextResponse.json({ ok: true, status: req.status });
  } catch {
    return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
  }
}
