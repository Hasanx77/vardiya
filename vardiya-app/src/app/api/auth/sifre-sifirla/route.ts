import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { disAdres, istemciIp } from "@/lib/url";
import { beklemeMetni, girisBasarisiz, girisDenetle } from "@/lib/giris-korumasi";
import { postaGonder, postaHazirMi } from "@/lib/mail";
import { sifreSifirlamaPostasi } from "@/lib/posta-sablonlari";
import {
  SIFIRLAMA_GECERLILIK_DK,
  gorunenAd,
  sifirlamaAnahtariOlustur,
} from "@/lib/sifre-sifirlama";

/**
 * "Şifremi unuttum" isteği.
 *
 * 🔒 Hesap varlığını sızdırmaz: e-posta kayıtlı olsa da olmasa da aynı yanıt
 * döner. Tek istisna, e-posta altyapısının hiç kurulmamış olması — bu bir
 * yapılandırma hatasıdır, kullanıcıya söylenmesi gerekir.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const ip = istemciIp(req);

  const yonlendir = (parametre: string) => {
    const url = disAdres(req, "/sifre-sifirla");
    url.search = parametre;
    return NextResponse.redirect(url, 303);
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return yonlendir("?hata=" + encodeURIComponent("Geçerli bir e-posta adresi gir."));
  }

  // Kaba kuvvet / e-posta bombardımanı sınırı: IP ve adres ayrı sayılır.
  // Sayaçlar veritabanında → sunucu yeniden başlasa da sıfırlanmaz.
  const anahtarlar = [
    { anahtar: `sifirla:ip:${ip}`, esik: 10 },
    { anahtar: `sifirla:eposta:${email}`, esik: 5 },
  ];
  const denetim = await girisDenetle(anahtarlar);
  if (!denetim.izinli) {
    return yonlendir(
      "?hata=" +
        encodeURIComponent(
          `Çok fazla sıfırlama isteği. ${beklemeMetni(denetim.bekleSaniye)} sonra tekrar dene.`,
        ),
    );
  }
  await girisBasarisiz(anahtarlar);

  // Canlıda SMTP yoksa kullanıcıyı boşa bekletmeyelim: bu bir yapılandırma hatası.
  // Geliştirmede posta `.mail-outbox/` klasörüne yazılır (akış test edilebilsin).
  if (!postaHazirMi() && process.env.NODE_ENV === "production") {
    console.error("sifre-sifirla: SMTP ayarları yok (SMTP_HOST/SMTP_USER/SMTP_PASS).");
    return yonlendir(
      "?hata=" +
        encodeURIComponent(
          "E-posta gönderimi şu an yapılandırılmadı. destek@zihnora.com.tr adresine yazabilirsin.",
        ),
    );
  }

  const kullanici = await prisma.user.findUnique({ where: { email } });

  if (kullanici) {
    try {
      const { anahtar } = await sifirlamaAnahtariOlustur(kullanici.id);
      const baglanti = disAdres(req, "/sifre-sifirla/yeni").toString() + `?token=${anahtar}`;
      const posta = sifreSifirlamaPostasi({
        kullaniciAdi: gorunenAd(kullanici),
        baglanti,
        dakika: SIFIRLAMA_GECERLILIK_DK,
      });

      const sonuc = await postaGonder({ kime: email, ...posta, konu: posta.konu });
      if (!sonuc.ok) {
        console.error("sifre-sifirla: posta gönderilemedi:", sonuc.hata);
      }
    } catch (e) {
      console.error("sifre-sifirla:", e);
    }
  }

  return yonlendir("?gonderildi=1&email=" + encodeURIComponent(email));
}
