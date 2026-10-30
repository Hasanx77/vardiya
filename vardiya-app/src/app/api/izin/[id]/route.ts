import { NextResponse } from "next/server";
import { ensureBusiness } from "@/lib/server-data";
import { izinKarari } from "@/lib/izin-db";
import { izinDurumuGecerliMi } from "@/lib/izin";
import { cleanText } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

/**
 * İzin talebine karar ver: onayla / reddet / iptal et.
 *
 * 🔒 `izinKarari` güncellemeyi `id + businessId + durum='bekliyor'` ile
 * sınırlar: başka işletmenin talebi ya da karar verilmiş talep değişmez.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const durum = String(body?.durum ?? "").trim();

  if (!["onaylandi", "reddedildi", "iptal"].includes(durum) || !izinDurumuGecerliMi(durum)) {
    return NextResponse.json(
      { hata: "durum: onaylandi, reddedildi veya iptal olmalı." },
      { status: 400 },
    );
  }

  const business = await ensureBusiness();
  const oldu = await izinKarari({
    id: String(id ?? ""),
    businessId: business.id,
    durum,
    kararNot: cleanText(body?.kararNot, 500),
  });

  if (!oldu) {
    return NextResponse.json(
      { hata: "Talep bulunamadı ya da daha önce karara bağlanmış." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, id, durum });
}
