import { prisma } from "@/lib/prisma";
import { toISODate } from "@/lib/dates";

type Ctx = { params: Promise<{ employeeId: string }> };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** ISO tarih + "HH:MM" → iCalendar yerel tarih-saat (floating) */
function icsDateTime(iso: string, time: string, addDay = 0): string {
  const [y, m, d] = iso.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const dt = new Date(y, (m || 1) - 1, (d || 1) + addDay, hh || 0, mm || 0, 0);
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(
    dt.getHours()
  )}${pad(dt.getMinutes())}00`;
}

function utcStamp(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// Personelin vardiyalarını iCalendar (.ics) olarak döndürür
export async function GET(_request: Request, { params }: Ctx) {
  const { employeeId } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { business: true },
  });
  if (!employee) {
    return new Response("Personel bulunamadı", { status: 404 });
  }

  const todayISO = toISODate(new Date());
  const assignments = await prisma.assignment.findMany({
    where: { employeeId, date: { gte: todayISO } },
    include: { shiftTemplate: true },
    orderBy: { date: "asc" },
  });

  const stamp = utcStamp(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vardiya//Vardiya Yonetimi//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const a of assignments) {
    const t = a.shiftTemplate;
    const overnight = t.end <= t.start;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${a.id}@vardiya`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDateTime(a.date, t.start)}`,
      `DTEND:${icsDateTime(a.date, t.end, overnight ? 1 : 0)}`,
      `SUMMARY:${escapeText(`${t.name} (${t.start}-${t.end})`)}`,
      `LOCATION:${escapeText(employee.business.name)}`,
      `DESCRIPTION:${escapeText(`${employee.business.name} · ${employee.name}`)}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  const body = lines.join("\r\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="vardiya-takvim.ics"',
      "Cache-Control": "no-store",
    },
  });
}
