import { NextResponse } from "next/server";
import { COOKIE_NAME, cerezAyarlari } from "@/lib/auth";
import { IKI_ADIM_BEKLEME_MS, IKI_ADIM_COOKIE, beklemeTokeni, oturumTokeni } from "@/lib/session";
import { disAdres, guvenliHedef, httpsMi } from "@/lib/url";
import { googleHazirMi, idTokenDogrula } from "@/lib/google";
import { googleHesabiniBulVeyaAc } from "@/lib/google-hesap";
import { denemeBasarisiz, denemeIzinli } from "@/lib/rate-limit";
import { ikiAdimAktifMi } from "@/lib/iki-adim";

/**
 * Google Identity Services ile giriş.
 *
 * Tarayıcıdaki "Google ile devam et" düğmesi bir **ID token** üretir ve buraya
 * gönderir. Token'ı Google'a doğrulatır, kullanıcıyı bulur/oluşturur ve oturum
 * çerezini yazar. **Client secret gerekmez** — sunucuda saklanacak bir sır yok.
 */
export async function GET(req: Request) {
  // Bu adres yalnız POST kabul eder; doğrudan ziyaret edilirse girişe dön.
  const url = disAdres(req, "/giris");
  url.searchParams.set("hata", "Google girişi bu adresten başlatılmaz. Aşağıdaki düğmeyi kullan.");
  return NextResponse.redirect(url, 303);
}

export async function POST(req: Request) {
  if (!googleHazirMi()) {
    return NextResponse.json({ hata: "Google ile giriş yapılandırılmadı." }, { status: 503 });
  }

  let credential = "";
  let hedef = "/panel";

  const icerik = (req.headers.get("content-type") ?? "").toLowerCase();
  if (icerik.includes("application/json")) {
    const govde = (await req.json().catch(() => ({}))) as {
      credential?: string;
      next?: string;
    };
    credential = String(govde.credential ?? "");
    hedef = guvenliHedef(String(govde.next ?? "/panel"), "/panel");
  } else {
    const form = await req.formData();
    credential = String(form.get("credential") ?? "");
    hedef = guvenliHedef(String(form.get("next") ?? "/panel"), "/panel");
  }

  if (!credential) {
    return NextResponse.json({ hata: "Google yanıtı eksik." }, { status: 400 });
  }

  // Kaba kuvvet: aynı IP'den dakikada çok fazla deneme olmasın.
  const ip = (req.headers.get("x-real-ip") ?? "").trim() || "yerel";
  if (!denemeIzinli(`google|${ip}`, 15)) {
    return NextResponse.json({ hata: "Çok fazla deneme. Biraz sonra tekrar dene." }, { status: 429 });
  }
  denemeBasarisiz(`google|${ip}`);

  const kimlik = await idTokenDogrula(credential);
  if (!kimlik) {
    return NextResponse.json({ hata: "Google hesabı doğrulanamadı." }, { status: 401 });
  }
  if (!kimlik.emailVerified) {
    return NextResponse.json(
      { hata: "Google e-posta adresin doğrulanmamış. Google hesabından doğrulayıp tekrar dene." },
      { status: 403 },
    );
  }

  try {
    const kullanici = await googleHesabiniBulVeyaAc(kimlik);
    const gidilecek = kullanici.onboardedAt ? hedef : "/basla";

    // 🔐 İki adımlı doğrulama açıksa (Google ile gelinse bile) kod sorulur.
    if (await ikiAdimAktifMi(kullanici.id)) {
      const hedefYol = `/iki-adim?next=${encodeURIComponent(gidilecek)}`;
      const bekleme = await beklemeTokeni(kullanici.id, true);
      const ayar = { ...cerezAyarlari(httpsMi(req), false), maxAge: Math.floor(IKI_ADIM_BEKLEME_MS / 1000) };

      if (!icerik.includes("application/json")) {
        const res = NextResponse.redirect(disAdres(req, hedefYol), 303);
        res.cookies.set(IKI_ADIM_COOKIE, bekleme, ayar);
        return res;
      }

      const res = NextResponse.json({ ok: true, hedef: disAdres(req, hedefYol).toString() });
      res.cookies.set(IKI_ADIM_COOKIE, bekleme, ayar);
      return res;
    }

    const cerez = await oturumTokeni(kullanici.id, kullanici.sessionVersion);

    // GSI "redirect" modu form gönderir → tarayıcıyı yönlendir (JSON değil).
    if (!icerik.includes("application/json")) {
      const res = NextResponse.redirect(disAdres(req, gidilecek), 303);
      res.cookies.set(COOKIE_NAME, cerez, cerezAyarlari(httpsMi(req), true));
      return res;
    }

    const res = NextResponse.json({ ok: true, hedef: disAdres(req, gidilecek).toString() });
    res.cookies.set(COOKIE_NAME, cerez, cerezAyarlari(httpsMi(req), true));
    return res;
  } catch (e) {
    console.error("google/gsi:", e);
    return NextResponse.json({ hata: "Giriş tamamlanamadı. Lütfen tekrar dene." }, { status: 500 });
  }
}
