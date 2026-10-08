import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";

// Tüm uygulama durumunu tek istekte döndürür (panel + personel görünümü kullanır)
export async function GET() {
  const business = await ensureBusiness();

  const [employees, shiftTemplates, assignments, requests, announcements] = await Promise.all([
    prisma.employee.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.shiftTemplate.findMany({ where: { businessId: business.id } }),
    prisma.assignment.findMany({ where: { businessId: business.id } }),
    prisma.timeOffRequest.findMany({
      where: { employee: { businessId: business.id } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.announcement.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    business: { id: business.id, name: business.name },
    employees: employees.map((e) => ({
      id: e.id,
      name: e.name,
      phone: e.phone,
      role: e.role,
      color: e.color,
      hourlyWage: e.hourlyWage,
      annualLeaveDays: e.annualLeaveDays,
    })),
    shiftTemplates: shiftTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      start: t.start,
      end: t.end,
      color: t.color,
    })),
    assignments: assignments.map((a) => ({
      employeeId: a.employeeId,
      date: a.date,
      shiftTemplateId: a.shiftTemplateId,
    })),
    requests: requests.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      date: r.date,
      type: r.type,
      note: r.note,
      status: r.status,
      targetEmployeeId: r.targetEmployeeId,
      createdAt: r.createdAt.toISOString(),
    })),
    announcements: announcements.map((a) => ({
      id: a.id,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
