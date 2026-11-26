import { NextResponse } from "next/server";
import { aktifKullanici } from "@/lib/auth";
import { ayarlariAl, ayarlariYaz, TEMA_SECENEKLERI, type Tema } from "@/lib/ayarlar";
import { DIL_COOKIE, dilGecerliMi, type Dil } from "@/lib/dil";

export const dynamic = "force-dynamic";

/** Kullanıcı ayarları (bildirim tercihleri + tema). */
export async function GET() {
  const kullanici = await aktifKullanici();
  if (!kullanici) return NextResponse.json({ hata: "Oturum gerekli" }, { status: 401 });
  return NextResponse.json(await ayarlariAl(kullanici.id), {
    headers: { "cache-control": "no-store" },
  });
}

export async function PATCH(req: Request) {
  const kullanici = await aktifKullanici();
  if (!kullanici) return NextResponse.json({ hata: "Oturum gerekli" }, { status: 401 });

  const govde = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const kismi: Record<string, boolean | Tema | Dil> = {};

  for (const anahtar of ["bildirimYayin", "bildirimIzin", "bildirimOzet"] as const) {
    if (anahtar in govde) {
      if (typeof govde[anahtar] !== "boolean") {
        return NextResponse.json({ hata: "Geçersiz değer." }, { status: 400 });
      }
      kismi[anahtar] = govde[anahtar] as boolean;
    }
  }
  if ("tema" in govde) {
    const tema = String(govde.tema ?? "");
    if (!TEMA_SECENEKLERI.includes(tema as Tema)) {
      return NextResponse.json({ hata: "Geçersiz tema." }, { status: 400 });
    }
    kismi.tema = tema as Tema;
  }
  if ("dil" in govde) {
    const dil = String(govde.dil ?? "");
    if (!dilGecerliMi(dil)) {
      return NextResponse.json({ hata: "Geçersiz dil." }, { status: 400 });
    }
    kismi.dil = dil as Dil;
  }

  const guncel = await ayarlariYaz(kullanici.id, kismi);
  const res = NextResponse.json(guncel, { headers: { "cache-control": "no-store" } });
  // Dil çerezi: sunucu bileşenleri ilk boyamada doğru dili çizsin.
  res.cookies.set(DIL_COOKIE, guncel.dil, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
