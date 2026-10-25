import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { istanbulGunu } from "@/lib/dates";
import { tokenCoz } from "@/lib/employee-link";
import { hizDenetle } from "@/lib/hiz-siniri";
import { shiftBlocks } from "@/lib/shifts";
import { istemciIp } from "@/lib/url";
import { yayindakiKayitlar } from "@/lib/yayin";

type Ctx = { params: Promise<{ employeeId: string }> };

const DAKIKA = 60_000;

/** Jetonu veritabanına düz yazmamak için kısa özet. */
function jetonAnahtari(jeton: string): string {
  return createHash("sha256").update(jeton).digest("hex").slice(0, 24);
}

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
export async function GET(request: Request, { params }: Ctx) {
  const { employeeId: token } = await params;

  // Hız sınırı: IP başına 60/dk, jeton başına 120/dk (paylaşımlı sayaç).
  const ip = istemciIp(request);
  const [ipSonuc, jetonSonuc] = await Promise.all([
    hizDenetle(`takvim:ip:${ip}`, 60, DAKIKA),
    hizDenetle(`takvim:jeton:${jetonAnahtari(String(token ?? ""))}`, 120, DAKIKA),
  ]);
  if (!ipSonuc.izinli || !jetonSonuc.izinli) {
    return new Response("Çok fazla istek. Lütfen biraz sonra tekrar dene.", {
      status: 429,
      headers: { "Retry-After": "60", "Cache-Control": "no-store" },
    });
  }

  // Takvim bağlantısı da personel linkiyle aynı belirteci kullanır:
  // link yenilenince/kapatılınca eski .ics adresi de çalışmaz.
  const employeeId = await tokenCoz(token);
  if (!employeeId) {
    return new Response("Personel bulunamadı", { status: 404 });
  }

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, active: true },
    include: { business: true },
  });
  if (!employee) {
    return new Response("Personel bulunamadı", { status: 404 });
  }

  const todayISO = istanbulGunu();
  const [assignments, weekPlans] = await Promise.all([
    prisma.assignment.findMany({
      where: { employeeId, date: { gte: todayISO } },
      include: { shiftTemplate: true },
      orderBy: { date: "asc" },
    }),
    prisma.weekPlan.findMany({
      where: { businessId: employee.businessId },
      select: { weekStart: true },
    }),
  ]);

  // Yalnızca yayınlanmış haftalar takvime girer (taslak plan ekibe sızmaz).
  const yayindaki = yayindakiKayitlar(
    assignments,
    weekPlans.map((w) => w.weekStart)
  );

  const stamp = utcStamp(new Date());
  const takvimAdi = escapeText(`${employee.name} · ${employee.business.name}`);
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vardiya//Vardiya Yonetimi//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${takvimAdi}`,
    "X-WR-TIMEZONE:Europe/Istanbul",
  ];

  for (const a of yayindaki) {
    const t = a.shiftTemplate;
    const bloklar = shiftBlocks(t);
    for (let i = 0; i < bloklar.length; i++) {
      const b = bloklar[i];
      const overnight = b.end <= b.start;
      const parca = bloklar.length > 1 ? `-${i + 1}` : "";
      lines.push(
        "BEGIN:VEVENT",
        `UID:${a.id}${parca}@vardiya`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${icsDateTime(a.date, b.start)}`,
        `DTEND:${icsDateTime(a.date, b.end, overnight ? 1 : 0)}`,
        `SUMMARY:${escapeText(`${t.name} (${b.start}-${b.end})`)}`,
        `LOCATION:${escapeText(employee.business.name)}`,
        `DESCRIPTION:${escapeText(`${employee.business.name} · ${employee.name}`)}`,
        "END:VEVENT"
      );
    }
  }

  lines.push("END:VCALENDAR");
  const body = lines.join("\r\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="vardiya-takvim.ics"; filename*=UTF-8''${encodeURIComponent(
        `vardiya-${employee.name}.ics`
      )}`,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
