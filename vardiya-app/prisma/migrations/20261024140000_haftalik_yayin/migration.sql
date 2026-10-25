-- Haftalık planın yayın durumu.
-- Kayıt varsa o hafta (pazartesi = weekStart) yayınlanmıştır; personel
-- bağlantısı ve .ics takvimi yalnızca yayınlanmış haftaları gösterir.
CREATE TABLE "WeekPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeekPlan_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WeekPlan_businessId_weekStart_key" ON "WeekPlan"("businessId", "weekStart");
CREATE INDEX "WeekPlan_businessId_idx" ON "WeekPlan"("businessId");
