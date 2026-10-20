import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureBusiness } from "@/lib/server-data";
import { linkAc, linkDurumu, linkKapat, linkYenile } from "@/lib/employee-link";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Personele özel bağlantı yönetimi (yalnızca işletme sahibi).
 * GET  → mevcut bağlantı durumu
 * POST → { islem: "yenile" | "kapat" | "ac" }
 *
 * Girişsiz erişim yok: middleware `/api/*` için oturum ister, ayrıca burada
 * personelin gerçekten bu işletmeye ait olduğu doğrulanır.
 */
async function sahibiMi(employeeId: string): Promise<boolean> {
  const business = await ensureBusiness();
  const emp = await prisma.employee.findFirst({
    where: { id: employeeId, businessId: business.id },
    select: { id: true },
  });
  return Boolean(emp);
}

function yetkisiz() {
  return NextResponse.json({ hata: "Oturum gerekli" }, { status: 401 });
}

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!(await sahibiMi(id))) {
      return NextResponse.json({ hata: "Personel bulunamadı" }, { status: 404 });
    }
    const durum = await linkDurumu(id);
    return NextResponse.json(durum, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return yetkisiz();
  }
}

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!(await sahibiMi(id))) {
      return NextResponse.json({ hata: "Personel bulunamadı" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const islem = String((body as { islem?: unknown })?.islem ?? "");

    if (islem === "kapat") {
      await linkKapat(id);
      return NextResponse.json(
        { aktif: false, yol: null },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    let token: string;
    if (islem === "yenile") token = await linkYenile(id);
    else if (islem === "ac") token = await linkAc(id);
    else {
      return NextResponse.json({ hata: "Geçersiz işlem" }, { status: 400 });
    }

    return NextResponse.json(
      { aktif: true, token, yol: `/ekip/${token}` },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return yetkisiz();
  }
}
