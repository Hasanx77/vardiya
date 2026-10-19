import { NextResponse } from "next/server";
import { aktifKullanici } from "@/lib/auth";
import { getStatePayload } from "@/lib/state";

/**
 * Verilerimi indir (taşınabilirlik hakkı).
 *
 * Kullanıcı kendi hesabına ait **tüm** veriyi tek bir JSON dosyası olarak indirir.
 * Başka hiçbir hesabın verisi bu yanıtta yer almaz.
 */
export async function GET() {
  const kullanici = await aktifKullanici();
  if (!kullanici) {
    return NextResponse.json({ hata: "Oturum gerekli" }, { status: 401 });
  }

  const durum = await getStatePayload();

  const veri = {
    indirilmeZamani: new Date().toISOString(),
    uygulama: "Vardiya (zihnora.com.tr)",
    hesap: {
      id: kullanici.id,
      email: kullanici.email,
      olusturulma: kullanici.createdAt.toISOString(),
      sonGiris: kullanici.lastLoginAt?.toISOString() ?? null,
      // Şifre özeti bilinçli olarak dışarıda bırakılır.
    },
    isletme: durum.business,
    personel: durum.employees,
    vardiyaSablonlari: durum.shiftTemplates,
    vardiyalar: durum.assignments,
    duyurular: durum.announcements,
    gunNotlari: durum.dayNotes,
  };

  const tarih = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(veri, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="vardiya-verilerim-${tarih}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
