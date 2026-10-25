/**
 * Google ile giriş (OAuth 2.0 + PKCE).
 *
 * 🔒 Düğme, `GOOGLE_CLIENT_ID` ve `GOOGLE_CLIENT_SECRET` tanımlı **değilse hiç
 * gösterilmez** — sahte/çalışmayan düğme yok.
 *
 * Akış:
 *   1. /api/auth/google → Google'a yönlendir (state + PKCE çerezleri)
 *   2. /api/auth/google/callback → kodu token'a çevir, kullanıcıyı bul/oluştur
 *   3. Oturum çerezi yaz, panele gönder
 */
import { createHash, randomBytes } from "node:crypto";

export const GOOGLE_DURUM_COOKIE = "vardiya_google";
export const GOOGLE_KAPSAM = "openid email profile";

export function googleHazirMi(): boolean {
  // 🔑 ID token akışı (Google Identity Services) yalnız **Client ID** ister;
  // secret yalnız sunucu tarafı kod değişiminde gerekir.
  return Boolean((process.env.GOOGLE_CLIENT_ID ?? "").trim());
}

/** İstemci kimliği (istemciye verilir; gizli değildir). */
export function googleIstemciKimligi(): string {
  return (process.env.GOOGLE_CLIENT_ID ?? "").trim();
}

/** Secret var mı? (yedek akış için) */
export function googleSecretVarMi(): boolean {
  return Boolean((process.env.GOOGLE_CLIENT_SECRET ?? "").trim());
}

function istemciKimligi(): string {
  return (process.env.GOOGLE_CLIENT_ID ?? "").trim();
}

function istemciGizlisi(): string {
  return (process.env.GOOGLE_CLIENT_SECRET ?? "").trim();
}

/** PKCE: code_verifier + code_challenge (S256). */
export function pkceUret(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function durumUret(): string {
  return randomBytes(16).toString("hex");
}

export function googleAdresi(opts: {
  yonlendirmeAdresi: string;
  durum: string;
  challenge: string;
  girisIpucu?: string;
}): string {
  const p = new URLSearchParams({
    client_id: istemciKimligi(),
    redirect_uri: opts.yonlendirmeAdresi,
    response_type: "code",
    scope: GOOGLE_KAPSAM,
    state: opts.durum,
    code_challenge: opts.challenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
    hl: "tr",
  });
  if (opts.girisIpucu) p.set("login_hint", opts.girisIpucu);
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

export type GoogleKullanici = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
};

/**
 * Google Identity Services'in verdiği **ID token**'ı doğrular.
 *
 * Neden `tokeninfo`: imza doğrulaması için JWKS + JWT kütüphanesi gerekir;
 * bu uç nokta token'ı Google'ın kendisine doğrulatır. Token kısa ömürlüdür
 * (1 saat) ve yalnız giriş anında bir kez kontrol edilir.
 *
 * Kontroller: `aud` bizim istemci kimliğimiz mi, süresi geçmiş mi, e-posta var mı.
 */
export async function idTokenDogrula(
  credential: string,
): Promise<GoogleKullanici | null> {
  if (!credential) return null;

  const yanit = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
    { cache: "no-store" },
  );
  if (!yanit.ok) {
    console.error("google: id token doğrulanamadı", yanit.status);
    return null;
  }

  const bilgi = (await yanit.json()) as {
    aud?: string;
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    exp?: string | number;
    name?: string;
  };

  if (bilgi.aud !== googleIstemciKimligi()) {
    console.error("google: aud uyuşmuyor");
    return null;
  }
  const sonKullanma = Number(bilgi.exp);
  if (!Number.isFinite(sonKullanma) || sonKullanma * 1000 < Date.now()) return null;
  if (!bilgi.sub || !bilgi.email) return null;

  return {
    sub: bilgi.sub,
    email: String(bilgi.email).toLowerCase(),
    emailVerified: bilgi.email_verified === true || bilgi.email_verified === "true",
    name: bilgi.name,
  };
}

/** Kodu erişim anahtarına çevirir, sonra kullanıcı bilgisini okur. */
export async function googleKullanicisi(
  kod: string,
  yonlendirmeAdresi: string,
  verifier: string,
): Promise<GoogleKullanici | null> {
  const govde = new URLSearchParams({
    code: kod,
    client_id: istemciKimligi(),
    client_secret: istemciGizlisi(),
    redirect_uri: yonlendirmeAdresi,
    grant_type: "authorization_code",
    code_verifier: verifier,
  });

  const tokenYaniti = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: govde.toString(),
    cache: "no-store",
  });
  if (!tokenYaniti.ok) {
    console.error("google: token alınamadı", tokenYaniti.status, await tokenYaniti.text().catch(() => ""));
    return null;
  }

  const token = (await tokenYaniti.json()) as { access_token?: string };
  if (!token.access_token) return null;

  const bilgiYaniti = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  if (!bilgiYaniti.ok) {
    console.error("google: userinfo alınamadı", bilgiYaniti.status);
    return null;
  }

  const bilgi = (await bilgiYaniti.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
  };

  if (!bilgi.sub || !bilgi.email) return null;

  return {
    sub: bilgi.sub,
    email: bilgi.email.toLowerCase(),
    emailVerified: bilgi.email_verified === true || bilgi.email_verified === "true",
    name: bilgi.name,
  };
}
