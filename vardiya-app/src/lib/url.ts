/**
 * Ters vekil (LiteSpeed/Passenger) arkasında çalıştığımız için isteğin kendi
 * adresi "localhost:3000" olur. Kullanıcıyı oraya göndermemek için dışarıdan
 * görünen alan adını (x-forwarded-host) kullanıyoruz.
 *
 * 🔒 Güvenlik: başlıklar istemciden gelebilir. Bu yüzden protokol yalnızca
 * http/https olabilir, host ise yalnızca basit bir alan adı + port kalıbına
 * uyuyorsa kabul edilir. Aksi halde isteğin kendi adresi kullanılır.
 */
const GECERLI_PROTO = new Set(["http", "https"]);

/** İzinli alan adları (env ile genişletilebilir). */
const IZINLI_HOSTLAR = new Set(
  (process.env.SITE_HOSTS ?? "zihnora.com.tr,www.zihnora.com.tr")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
);

function ilkDeger(deger: string | null): string {
  return (deger ?? "").split(",")[0].trim().toLowerCase();
}

/** Yerel/özel adres mi? (HTTP varsayılanı için) */
function yerelHost(host: string): boolean {
  return (
    !host ||
    host.startsWith("localhost") ||
    host.startsWith("127.") ||
    host.startsWith("[::1]") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

/** Yabancı/geçersiz Host başlığını kanonik alan adına çeker (açık yönlendirme önlenir). */
export function guvenliHost(host: string): string {
  const h = (host || "").trim().toLowerCase();
  if (yerelHost(h)) return h;
  if (IZINLI_HOSTLAR.has(h)) return h;
  return IZINLI_HOSTLAR.values().next().value ?? "zihnora.com.tr";
}

/** İstemci IP'si: ters vekilin eklediği **son** X-Forwarded-For değeri güvenilir. */
export function istemciIp(req: Request): string {
  const xff = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return (req.headers.get("x-real-ip") ?? "").trim() || xff[xff.length - 1] || "yerel";
}

export function disAdres(req: Request, yol: string): URL {
  const h = req.headers;
  const host = ilkDeger(h.get("x-forwarded-host")) || ilkDeger(h.get("host"));
  const istekProto = new URL(req.url).protocol.replace(":", "");
  const forwardedProto = ilkDeger(h.get("x-forwarded-proto"));

  // Ters vekil protokolü iletmediyse dışarıdan HTTPS varsay (canlı site https).
  const proto = GECERLI_PROTO.has(forwardedProto)
    ? forwardedProto
    : yerelHost(host)
      ? istekProto || "http"
      : "https";

  const yolGuvenli = yol.startsWith("/") ? yol : `/${yol}`;

  if (host) {
    const guvenli = guvenliHost(host);
    if (guvenli) return new URL(`${proto}://${guvenli}${yolGuvenli}`);
  }
  return new URL(yolGuvenli, req.url);
}

export function httpsMi(req: Request): boolean {
  const forwarded = ilkDeger(req.headers.get("x-forwarded-proto"));
  if (GECERLI_PROTO.has(forwarded)) return forwarded === "https";

  // Başlık yoksa: yerel geliştirme http, canlı (yerel olmayan host) https kabul edilir.
  const host = ilkDeger(req.headers.get("x-forwarded-host")) || ilkDeger(req.headers.get("host"));
  if (!yerelHost(host)) return true;
  return new URL(req.url).protocol === "https:";
}

/**
 * Açık yönlendirmeyi engeller: yalnızca site içi yollar kabul edilir.
 *
 * `//evil.com` ve `/\evil.com` gibi yollar tarayıcıda başka alan adına
 * çözülebilir; onları da reddediyoruz.
 */
export function guvenliHedef(next: string, varsayilan = "/panel"): string {
  const hedef = String(next ?? "").trim();
  if (!hedef.startsWith("/")) return varsayilan;
  if (hedef.startsWith("//")) return varsayilan;
  if (hedef.includes("\\") || /[\u0000-\u001f\u007f]/.test(hedef)) return varsayilan;
  return hedef;
}
