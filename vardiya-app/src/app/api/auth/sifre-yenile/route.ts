import { NextResponse } from "next/server";
import { disAdres, istemciIp } from "@/lib/url";
import { denemeBasarisiz, denemeIzinli } from "@/lib/rate-limit";
import { sifreyiSifirla } from "@/lib/sifre-sifirlama";
import { girdilerGecerliMi } from "@/lib/auth";

/**
 * Yeni şifreyi kaydeder (e-postadaki bağlantıdan gelir).
 * Başarılıysa kullanıcı giriş sayfasına gönderilir; eski oturumlar geçersizdir.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const anahtar = String(form.get("token") ?? "").trim();
  const sifre = String(form.get("sifre") ?? "");
  const sifreTekrar = String(form.get("sifreTekrar") ?? "");
  const ip = istemciIp(req);

  const hataYonlendir = (mesaj: string) => {
    const url = disAdres(req, "/sifre-sifirla/yeni");
    url.searchParams.set("token", anahtar);
    url.searchParams.set("hata", mesaj);
    return NextResponse.redirect(url, 303);
  };

  if (!anahtar) {
    return NextResponse.redirect(disAdres(req, "/sifre-sifirla?hata=" + encodeURIComponent("Bağlantı geçersiz.")), 303);
  }

  if (!denemeIzinli(`sifre-yenile|${ip}`, 10)) {
    return hataYonlendir("Çok fazla deneme. 10 dakika sonra tekrar dene.");
  }
  denemeBasarisiz(`sifre-yenile|${ip}`);

  // E-posta biçimi burada kullanılmıyor; yalnız şifre kuralları denetlenir.
  const bicim = girdilerGecerliMi("gecerli@ornek.com", sifre);
  if (bicim) return hataYonlendir(bicim);
  if (sifre !== sifreTekrar) return hataYonlendir("Şifreler birbiriyle uyuşmuyor.");

  let oldu = false;
  try {
    oldu = await sifreyiSifirla(anahtar, sifre);
  } catch (e) {
    console.error("sifre-yenile:", e);
    return hataYonlendir("Şifre güncellenemedi. Lütfen tekrar dene.");
  }

  if (!oldu) {
    return hataYonlendir("Bağlantının süresi dolmuş veya daha önce kullanılmış.");
  }

  const url = disAdres(req, "/giris");
  url.searchParams.set("yenilendi", "1");
  return NextResponse.redirect(url, 303);
}
