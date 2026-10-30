import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { izinTalebiOlustur, izinTalepleri } from "@/lib/izin-db";
import { cleanText } from "@/lib/validate";

/**
 * İşletmenin izin/mazeret talepleri.
 *
 * GET  → son talepler (panel tazelemesi; state yanıtıyla aynı liste)
 * POST → patron **elle** izin ekler (otomatik onaylı)
 *
 * 🔒 `ensureBusiness()` oturumdaki kullanıcının işletmesini döner; personel
 * kimliği o işletmeye ait değilse istek reddedilir (IDOR koruması).
 */
export async function GET() {
  const business = await ensureBusiness();
  const talepler = await izinTalepleri(business.id);
  return NextResponse.json({ izinTalepleri: talepler });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const business = await ensureBusiness();

  const employeeId = String(body?.employeeId ?? "").trim();
  if (!employeeId) {
    return NextResponse.json({ hata: "Personel seçilmedi." }, { status: 400 });
  }

  const personel = await prisma.employee.findFirst({
    where: { id: employeeId, businessId: business.id, active: true },
    select: { id: true },
  });
  if (!personel) {
    return NextResponse.json({ hata: "Personel bulunamadı." }, { status: 404 });
  }

  const sonuc = await izinTalebiOlustur({
    businessId: business.id,
    employeeId: personel.id,
    baslangic: String(body?.baslangic ?? ""),
    bitis: String(body?.bitis ?? ""),
    tur: String(body?.tur ?? "izin"),
    not: cleanText(body?.not, 500),
    // Patron elle eklediği için doğrudan onaylı.
    durum: "onaylandi",
  });

  if (!sonuc.ok) {
    return NextResponse.json({ hata: sonuc.hata }, { status: 400 });
  }
  return NextResponse.json({ ok: true, talep: sonuc.talep }, { status: 201 });
}
