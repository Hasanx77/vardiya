import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, cerezAyarlari, girdilerGecerliMi, sifreOzetle } from "@/lib/auth";
import { oturumTokeni } from "@/lib/session";
import { DEFAULT_SHIFTS } from "@/lib/shifts";
import { disAdres, guvenliHedef, httpsMi } from "@/lib/url";

/**
 * Kayıt ol.
 *
 * Akış: e-posta + şifre doğrulanır → kullanıcı oluşturulur → kullanıcıya ait
 * **boş bir işletme** ve varsayılan vardiya şablonları kurulur → oturum açılır.
 * Kullanıcı verisi asla başka bir hesapla paylaşılmaz (işletme, kullanıcıya bağlıdır).
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const sifre = String(form.get("sifre") ?? "");
  const sifreTekrar = String(form.get("sifreTekrar") ?? "");
  const isletme = String(form.get("isletme") ?? "").trim().slice(0, 80);
  const next = guvenliHedef(String(form.get("next") ?? "/basla"), "/basla");

  const hataYonlendir = (mesaj: string) => {
    const url = disAdres(req, "/kayit");
    url.searchParams.set("hata", mesaj);
    if (email) url.searchParams.set("email", email);
    if (isletme) url.searchParams.set("isletme", isletme);
    return NextResponse.redirect(url, 303);
  };

  const bicimHatasi = girdilerGecerliMi(email, sifre);
  if (bicimHatasi) return hataYonlendir(bicimHatasi);
  if (sifre !== sifreTekrar) return hataYonlendir("Şifreler birbiriyle uyuşmuyor.");

  const varOlan = await prisma.user.findUnique({ where: { email } });
  if (varOlan) return hataYonlendir("Bu e-posta ile bir hesap var. Giriş yapmayı dene.");

  const kullanici = await prisma.user.create({
    data: { email, passwordHash: sifreOzetle(sifre), lastLoginAt: new Date() },
  });

  const business = await prisma.business.create({
    data: { userId: kullanici.id, name: isletme || "İşletmem" },
  });

  await prisma.shiftTemplate.createMany({
    data: DEFAULT_SHIFTS.map((s) => ({
      businessId: business.id,
      name: s.name,
      start: s.start,
      end: s.end,
      color: s.color,
      minStaff: s.minStaff,
    })),
  });

  const res = NextResponse.redirect(disAdres(req, next), 303);
  res.cookies.set(COOKIE_NAME, await oturumTokeni(kullanici.id), cerezAyarlari(httpsMi(req)));
  return res;
}
