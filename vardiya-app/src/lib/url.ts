/**
 * Ters vekil (LiteSpeed/Passenger) arkasında çalıştığımız için isteğin kendi
 * adresi "localhost:3000" olur. Kullanıcıyı oraya göndermemek için dışarıdan
 * görünen alan adını (x-forwarded-host) kullanıyoruz.
 */
export function disAdres(req: Request, yol: string): URL {
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return new URL(`${proto}://${host}${yol}`);
  return new URL(yol, req.url);
}

export function httpsMi(req: Request): boolean {
  const proto =
    req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  return proto === "https";
}

/** Açık yönlendirmeyi engeller: yalnızca site içi yollar kabul edilir. */
export function guvenliHedef(next: string, varsayilan = "/panel"): string {
  return next.startsWith("/") && !next.startsWith("//") ? next : varsayilan;
}
