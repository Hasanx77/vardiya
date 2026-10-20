import { NextResponse } from "next/server";
import { mesajKaydet } from "@/lib/messages";
import { denemeBasarisiz, denemeIzinli } from "@/lib/rate-limit";
import { disAdres } from "@/lib/url";

/**
 * İletişim formu.
 *
 * Spam koruması: (1) gizli "website" tuzağı — botlar doldurur, insanlar görmez;
 * (2) IP başına 10 dakikada 5 gönderim sınırı; (3) uzunluk/e-posta doğrulaması.
 * Mesaj veritabanına yazılır; sahibi `/mesajlar` sayfasından okur.
 */
export async function POST(req: Request) {
  const form = await req.formData();

  const geri = (params: Record<string, string>) => {
    const url = disAdres(req, "/iletisim");
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return NextResponse.redirect(url, 303);
  };

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "yerel";
  const anahtar = `iletisim|${ip}`;

  if (!denemeIzinli(anahtar, 5)) {
    return geri({ hata: "Çok fazla mesaj gönderildi. Lütfen 10 dakika sonra tekrar dene." });
  }

  // Bal küpü (honeypot): gerçek kullanıcı bu alanı görmez.
  if (String(form.get("website") ?? "").trim()) {
    return geri({ ok: "1" });
  }

  const ad = String(form.get("ad") ?? "").trim().slice(0, 80);
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 160);
  const mesaj = String(form.get("mesaj") ?? "").trim().slice(0, 3000);
  const onay = String(form.get("onay") ?? "");

  const hata = (m: string) =>
    geri({ hata: m, ad, email, mesaj });

  if (ad.length < 2) return hata("Lütfen adını yaz.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return hata("Geçerli bir e-posta adresi gir.");
  }
  if (mesaj.length < 10) return hata("Mesajın en az 10 karakter olmalı.");
  if (onay !== "on") return hata("Devam etmek için gizlilik aydınlatmasını onaylamalısın.");

  denemeBasarisiz(anahtar);

  try {
    await mesajKaydet({ ad, email, mesaj });
  } catch (e) {
    console.error("iletişim mesajı:", e);
    return hata("Mesaj kaydedilemedi. Lütfen tekrar dene veya destek@zihnora.com.tr adresine yaz.");
  }

  return geri({ ok: "1" });
}
