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
const GECERLI_HOST = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::\d{1,5})?$/i;

function ilkDeger(deger: string | null): string {
  return (deger ?? "").split(",")[0].trim().toLowerCase();
}

export function disAdres(req: Request, yol: string): URL {
  const h = req.headers;
  const proto = ilkDeger(h.get("x-forwarded-proto"));
  const guvenliProto = GECERLI_PROTO.has(proto)
    ? proto
    : new URL(req.url).protocol.replace(":", "") || "https";
  const host = ilkDeger(h.get("x-forwarded-host")) || ilkDeger(h.get("host"));
  const yolGuvenli = yol.startsWith("/") ? yol : `/${yol}`;

  if (host && GECERLI_HOST.test(host)) {
    return new URL(`${guvenliProto}://${host}${yolGuvenli}`);
  }
  return new URL(yolGuvenli, req.url);
}

export function httpsMi(req: Request): boolean {
  const forwarded = ilkDeger(req.headers.get("x-forwarded-proto"));
  if (GECERLI_PROTO.has(forwarded)) return forwarded === "https";
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
