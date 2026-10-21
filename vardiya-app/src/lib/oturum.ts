import { redirect } from "next/navigation";
import { aktifKullanici } from "./auth";

/**
 * Korumalı sayfalar için oturum kapısı.
 *
 * `middleware` eski sürümlü çerezi (şifre değişmiş) Edge'de DB'ye bakmadan
 * geçirebilir; bu yardımcı sunucu tarafında sürümü doğrular ve girişe atar.
 */
export async function oturumGerekli(next = "/panel") {
  const kullanici = await aktifKullanici();
  if (!kullanici) {
    redirect(`/giris?next=${encodeURIComponent(next)}`);
  }
  return kullanici;
}
