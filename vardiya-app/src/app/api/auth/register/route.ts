import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, cerezAyarlari, girdilerGecerliMi, sifreOzetle } from "@/lib/auth";
import { oturumAltyapisiHazir, oturumTokeni } from "@/lib/session";
import { standartSablonlar } from "@/lib/shifts";
import { normalizeTime } from "@/lib/validate";
import { disAdres, guvenliHedef, httpsMi, istemciIp } from "@/lib/url";
import { denemeBasarisiz, denemeIzinli } from "@/lib/rate-limit";

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

  // Bot koruması: (1) gizli bal küpü alanı, (2) IP başına 10 dakikada 5 kayıt denemesi.
  const ip = istemciIp(req);
  const anahtar = `kayit|${ip}`;
  if (!denemeIzinli(anahtar, 5)) {
    return hataYonlendir("Çok fazla kayıt denemesi. Lütfen 10 dakika sonra tekrar dene.");
  }
  denemeBasarisiz(anahtar);
  if (String(form.get("website") ?? "").trim()) {
    // Bot: hiçbir hesap açmadan sessizce normal akışa gönder.
    return NextResponse.redirect(disAdres(req, next), 303);
  }

  const bicimHatasi = girdilerGecerliMi(email, sifre);
  if (bicimHatasi) return hataYonlendir(bicimHatasi);
  if (sifre !== sifreTekrar) return hataYonlendir("Şifreler birbiriyle uyuşmuyor.");

  // Oturum anahtarı yoksa hesap açmak anlamsız: kullanıcı giriş yapamaz.
  if (!oturumAltyapisiHazir()) {
    return hataYonlendir("Sunucu yapılandırması eksik (oturum anahtarı). Lütfen yöneticiye bildir.");
  }

  const varOlan = await prisma.user.findUnique({ where: { email } });
  if (varOlan) return hataYonlendir("Bu e-posta ile bir hesap var. Giriş yapmayı dene.");

  // ⚠️ normalizeTime geçersiz girişte "" döner (null değil). Bu yüzden
  // `??` yerine `||` kullanılmalı; aksi halde openTime "" kalıyor ve
  // şablonlar 00:00–12:00 gibi anlamsız saatlerle üretiliyordu.
  const acilis = normalizeTime(String(form.get("acilis") ?? "")) || "09:00";
  const kapanisHam = normalizeTime(String(form.get("kapanis") ?? "")) || "23:00";
  const kapanis = kapanisHam === acilis ? "23:59" : kapanisHam;

  let kullanici: { id: string; sessionVersion: number };
  try {
    // Kullanıcı + işletme + şablonlar tek işlemde: yarıda hata olursa
    // "işletmesi olmayan hesap" kalmaz.
    kullanici = await prisma.$transaction(async (tx) => {
      const yeni = await tx.user.create({
        data: { email, passwordHash: sifreOzetle(sifre), lastLoginAt: new Date() },
      });

      const business = await tx.business.create({
        data: {
          userId: yeni.id,
          name: isletme || "İşletmem",
          openTime: acilis,
          closeTime: kapanis,
        },
      });

      await tx.shiftTemplate.createMany({
        data: standartSablonlar(business.openTime, business.closeTime).map((s) => ({
          businessId: business.id,
          name: s.name,
          start: s.start,
          end: s.end,
          color: s.color,
          minStaff: s.minStaff,
        })),
      });

      return yeni;
    });
  } catch (e) {
    // Aynı e-posta ile eşzamanlı iki kayıt geldiyse (unique yarışı):
    const kod = (e as { code?: string })?.code;
    if (kod === "P2002") {
      return hataYonlendir("Bu e-posta ile bir hesap var. Giriş yapmayı dene.");
    }
    console.error("kayıt:", e);
    return hataYonlendir("Hesap oluşturulamadı. Lütfen tekrar dene.");
  }

  const res = NextResponse.redirect(disAdres(req, next), 303);
  res.cookies.set(COOKIE_NAME, await oturumTokeni(kullanici.id, kullanici.sessionVersion), cerezAyarlari(httpsMi(req)));
  return res;
}
