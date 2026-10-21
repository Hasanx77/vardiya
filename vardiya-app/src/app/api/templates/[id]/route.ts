import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { cleanText, isValidColor, normalizeTime } from "@/lib/validate";
import { araGecerliMi } from "@/lib/shifts";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Vardiya şablonu güncelle / sil.
 * 🔒 Kayıt oturumdaki kullanıcının işletmesine ait değilse işlem yapılmaz.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const business = await ensureBusiness();
  const body = await request.json().catch(() => ({}));

  const data: Record<string, string | number | null> = {};
  const name = cleanText(body?.name, 30);
  const start = normalizeTime(body?.start);
  const end = normalizeTime(body?.end);
  if (name) data.name = name;
  if (start) data.start = start;
  if (end) data.end = end;
  if (isValidColor(body?.color)) data.color = String(body.color);
  if (body?.minStaff !== undefined) {
    const m = Number(body.minStaff);
    if (Number.isFinite(m) && m >= 0) data.minStaff = Math.min(999, Math.round(m));
  }

  // Bölünmüş vardiya arası: iki alan birlikte gönderilir.
  // Boş gönderilirse ("") ara kaldırılır.
  const araIstendi = body?.breakStart !== undefined || body?.breakEnd !== undefined;
  if (araIstendi) {
    const bs = normalizeTime(body?.breakStart);
    const be = normalizeTime(body?.breakEnd);
    if (!bs && !be) {
      data.breakStart = null;
      data.breakEnd = null;
    } else if (!bs || !be) {
      return NextResponse.json(
        { error: "Ara için başlangıç ve bitiş saatleri birlikte girilmeli." },
        { status: 400 },
      );
    } else {
      data.breakStart = bs;
      data.breakEnd = be;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  // Kısmi güncellemede de saatler tutarlı kalsın.
  if (data.start !== undefined || data.end !== undefined || araIstendi) {
    const mevcut = await prisma.shiftTemplate.findFirst({
      where: { id, businessId: business.id },
      select: { start: true, end: true, breakStart: true, breakEnd: true },
    });
    if (!mevcut) {
      return NextResponse.json({ error: "Şablon bulunamadı" }, { status: 404 });
    }
    const yeniStart = (data.start as string | undefined) ?? mevcut.start;
    const yeniEnd = (data.end as string | undefined) ?? mevcut.end;
    if (yeniStart === yeniEnd) {
      return NextResponse.json(
        { error: "Başlangıç ve bitiş saati aynı olamaz." },
        { status: 400 },
      );
    }

    if (data.breakStart) {
      const bs = String(data.breakStart);
      const be = String(data.breakEnd);
      if (!araGecerliMi(yeniStart, yeniEnd, bs, be)) {
        return NextResponse.json(
          { error: "Ara saatleri vardiya içinde ve başlangıç < bitiş olacak şekilde girilmeli." },
          { status: 400 },
        );
      }
    } else if (
      !araIstendi &&
      mevcut.breakStart &&
      mevcut.breakEnd &&
      !araGecerliMi(yeniStart, yeniEnd, mevcut.breakStart, mevcut.breakEnd)
    ) {
      // Saatler değişti ve mevcut ara artık vardiyaya sığmıyor:
      // ekranda "ara" görünüp saat hesabında yok sayılmasın diye temizle.
      data.breakStart = null;
      data.breakEnd = null;
    }
  }

  const sonuc = await prisma.shiftTemplate.updateMany({
    where: { id, businessId: business.id },
    data,
  });
  if (sonuc.count === 0) {
    return NextResponse.json({ error: "Şablon bulunamadı" }, { status: 404 });
  }

  const t = await prisma.shiftTemplate.findUnique({ where: { id } });
  return NextResponse.json({
    id: t?.id,
    name: t?.name,
    start: t?.start,
    end: t?.end,
    breakStart: t?.breakStart ?? null,
    breakEnd: t?.breakEnd ?? null,
    color: t?.color,
    minStaff: t?.minStaff,
  });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const business = await ensureBusiness();

  const sonuc = await prisma.shiftTemplate.deleteMany({
    where: { id, businessId: business.id },
  });
  if (sonuc.count === 0) {
    return NextResponse.json({ error: "Şablon bulunamadı" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
