// Uygulamanın temel veri tipleri
// Model: işveren yönetir; personel yalnızca görüntüler.

export type ColorKey =
  | "sky"
  | "emerald"
  | "amber"
  | "violet"
  | "rose"
  | "cyan"
  | "lime"
  | "orange"
  | "fuchsia"
  | "teal";

/** Bir çalışan (personel) */
export type Employee = {
  id: string;
  name: string;
  /** Telefon — serbest format girilebilir, gönderirken normalize edilir */
  phone: string;
  /** Görev / pozisyon (ör. Barista, Garson, Şef) */
  role: string;
  color: ColorKey;
  /** Yıllık izin hakkı (gün) */
  annualLeaveDays: number;
};

/** Yeniden kullanılabilir vardiya şablonu (ör. Sabah 09:00-17:00) */
export type ShiftTemplate = {
  id: string;
  name: string;
  /** "HH:MM" */
  start: string;
  /** "HH:MM" */
  end: string;
  /**
   * Bölünmüş vardiya: iki çalışma bloğu arasındaki **ücretsiz** ara.
   * Örnek: 09:00–22:00 + ara 13:00–17:00 → net 9 saat.
   */
  breakStart?: string | null;
  breakEnd?: string | null;
  color: ColorKey;
  /** Hedeflenen en az kişi sayısı (0 = hedef yok) */
  minStaff: number;
};

/** Atamalar: anahtar = `${employeeId}__${YYYY-MM-DD}`, değer = shiftTemplateId */
export type Assignments = Record<string, string>;

/** Sunucudan gelen atama satırı */
export type AssignmentRow = {
  employeeId: string;
  date: string;
  shiftTemplateId: string;
};

/** İşverenin ekibe duyurusu */
export type Announcement = {
  id: string;
  message: string;
  createdAt: string;
};

/** Gün bazlı not */
export type DayNote = {
  date: string;
  note: string;
};

/** İzin / mazeret talebinin türü */
export type IzinTuru = "izin" | "mazeret" | "rapor" | "degisim";

/** İzin talebinin durumu — patron onaylar. */
export type IzinDurumu = "bekliyor" | "onaylandi" | "reddedildi" | "iptal";

/**
 * Personelden gelen izin / mazeret talebi.
 *
 * `IzinTalebi` tablosu şemada değil; canlıya migration gerektirmeden ham SQL
 * ile kurulur (`src/lib/izin-db.ts`). Bu yüzden alanlar düz metindir.
 */
export type IzinTalebi = {
  id: string;
  employeeId: string;
  /** "YYYY-MM-DD" (dahil) */
  baslangic: string;
  /** "YYYY-MM-DD" (dahil) */
  bitis: string;
  tur: IzinTuru;
  /** Personelin isteğe bağlı açıklaması — sağlık detayı istenmez. */
  not: string;
  durum: IzinDurumu;
  /** ISO zaman damgası */
  createdAt: string;
  /** Karar verildiyse ISO zaman damgası, yoksa null */
  kararAt: string | null;
  /** Patronun kısa notu (opsiyonel) */
  kararNot: string;
};

/** /api/state yanıtı */
export type StatePayload = {
  business: { id: string; name: string; openTime: string; closeTime: string };
  employees: Employee[];
  shiftTemplates: ShiftTemplate[];
  assignments: AssignmentRow[];
  announcements: Announcement[];
  dayNotes: DayNote[];
  /**
   * Yayınlanmış haftaların pazartesi günleri ("YYYY-MM-DD").
   * Burada olmayan haftalar **taslaktır**: personel linki ve `.ics`
   * takvimi yalnızca bu listedeki haftaları gösterir.
   */
  publishedWeeks: string[];
  /**
   * İşletmenin izin/mazeret talepleri (son 200).
   * Personel bağlantısı yalnızca **kendi** taleplerini görür; bu alan panel
   * içindir ve oturum gerektirir.
   */
  izinTalepleri: IzinTalebi[];
};

/** Atama anahtarı üretir */
export function assignmentKey(employeeId: string, isoDate: string): string {
  return `${employeeId}__${isoDate}`;
}
