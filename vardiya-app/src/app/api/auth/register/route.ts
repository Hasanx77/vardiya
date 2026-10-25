import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, cerezAyarlari, girdilerGecerliMi, sifreOzetle } from "@/lib/auth";
import { oturumAltyapisiHazir, oturumTokeni } from "@/lib/session";
import { disAdres, guvenliHedef, httpsMi, istemciIp } from "@/lib/url";
import { beklemeMetni, girisBasarisiz, girisDenetle } from "@/lib/giris-korumasi";
import { hesapOlustur } from "@/lib/hesap-olustur";

/**
 * Kayıt ol — **en kısa yol**.
 *
 * Patron kararı (22 Eki 2026): "sadece e-posta + şifre olsun, adam sıkılıp
 * çıkmasın". İşletme adı, mesai saatleri ve görünen ad artık burada sorulmaz;
 * hesap açıldıktan sonra `/basla` ekranında **adım adım** istenir.
 *
 * Kullanıcı adı e-postadan türetilir (hasan.mum@gmail.com → hasan.mum);
 * çakışırsa sonuna sayı eklenir. Kullanıcı bunu başlangıç ekranında değiştirir.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const sifre = String(form.get("sifre") ?? "");
  const sifreTekrar = String(form.get("sifreTekrar") ?? "");
  const next = guvenliHedef(String(form.get("next") ?? "/basla"), "/basla");

  const hataYonlendir = (mesaj: string) => {
    const url = disAdres(req, "/kayit");
    url.searchParams.set("hata", mesaj);
    if (email) url.searchParams.set("email", email);
    return NextResponse.redirect(url, 303);
  };

  // Bot koruması: (1) gizli bal küpü alanı, (2) IP + e-posta başına kalıcı
  // deneme sınırı (veritabanında tutulur; sunucu yeniden başlasa da sıfırlanmaz).
  const ip = istemciIp(req);
  const anahtarlar = [
    { anahtar: `kayit:ip:${ip}`, esik: 10 },
    { anahtar: `kayit:eposta:${email}`, esik: 5 },
  ];
  const denetim = await girisDenetle(anahtarlar);
  if (!denetim.izinli) {
    return hataYonlendir(
      `Çok fazla kayıt denemesi. ${beklemeMetni(denetim.bekleSaniye)} sonra tekrar dene.`,
    );
  }
  await girisBasarisiz(anahtarlar);
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

  let kullanici;
  try {
    kullanici = await hesapOlustur({ email, passwordHash: await sifreOzetle(sifre) });
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
  res.cookies.set(
    COOKIE_NAME,
    await oturumTokeni(kullanici.id, kullanici.sessionVersion),
    cerezAyarlari(httpsMi(req)),
  );
  return res;
}
