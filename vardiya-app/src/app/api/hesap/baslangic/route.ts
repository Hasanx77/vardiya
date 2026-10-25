import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aktifKullanici } from "@/lib/auth";
import { ensureBusiness } from "@/lib/server-data";
import { disAdres } from "@/lib/url";
import { normalizeTime } from "@/lib/validate";
import { standartSablonlar } from "@/lib/shifts";
import { kullaniciAdiHatasi, kullaniciAdiTemizle } from "@/lib/kullanici-adi";

/**
 * Başlangıç adımları (onboarding).
 *
 * Kayıt yalnız e-posta + şifre ile yapıldığı için görünen ad, işletme adı ve
 * mesai saatleri burada, üç kısa adımda toplanır. Kayıt formunu uzatmamak
 * bilinçli bir karar (uzun form → terk oranı yüksek).
 */
export async function POST(req: Request) {
  const kullanici = await aktifKullanici();
  if (!kullanici) {
    return NextResponse.redirect(disAdres(req, "/giris"), 303);
  }

  const form = await req.formData();
  const adHam = String(form.get("username") ?? "");
  const isletme = String(form.get("isletme") ?? "").trim().slice(0, 80);
  const acilis = normalizeTime(String(form.get("acilis") ?? "")) || "09:00";
  const kapanisHam = normalizeTime(String(form.get("kapanis") ?? "")) || "23:00";
  const kapanis = kapanisHam === acilis ? "23:59" : kapanisHam;

  const hataYonlendir = (mesaj: string) => {
    const url = disAdres(req, "/basla");
    url.searchParams.set("hata", mesaj);
    return NextResponse.redirect(url, 303);
  };

  const ad = kullaniciAdiTemizle(adHam);
  const adHatasi = kullaniciAdiHatasi(adHam);
  if (adHatasi) return hataYonlendir(adHatasi);

  const cakisan = await prisma.user.findFirst({
    where: { username: ad, NOT: { id: kullanici.id } },
    select: { id: true },
  });
  if (cakisan) return hataYonlendir("Bu kullanıcı adı alınmış. Başka bir tane seç.");

  const business = await ensureBusiness();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: kullanici.id },
        data: { username: ad, onboardedAt: kullanici.onboardedAt ?? new Date() },
      });

      await tx.business.update({
        where: { id: business.id },
        data: { name: isletme || business.name, openTime: acilis, closeTime: kapanis },
      });

      // Şablonları yeni saatlere uydur (vardiya ataması yoksa tamamen güvenli;
      // atama varsa yalnız saatler güncellenir, atamalar silinmez).
      const mevcut = await tx.shiftTemplate.findMany({ where: { businessId: business.id } });
      const yeni = standartSablonlar(acilis, kapanis);

      for (const sablon of yeni) {
        const eski = mevcut.find((m) => m.name.startsWith(sablon.name));
        if (eski) {
          await tx.shiftTemplate.update({
            where: { id: eski.id },
            data: { start: sablon.start, end: sablon.end },
          });
        } else {
          await tx.shiftTemplate.create({
            data: {
              businessId: business.id,
              name: sablon.name,
              start: sablon.start,
              end: sablon.end,
              color: sablon.color,
              minStaff: sablon.minStaff,
            },
          });
        }
      }
    });
  } catch (e) {
    console.error("baslangic:", e);
    return hataYonlendir("Kaydedilemedi. Lütfen tekrar dene.");
  }

  const url = disAdres(req, "/panel");
  url.searchParams.set("hosgeldin", "1");
  return NextResponse.redirect(url, 303);
}
