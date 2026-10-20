-- Bölünmüş vardiya: iki çalışma bloğu arasındaki ücretsiz ara.
-- Örnek: 09:00–22:00, ara 13:00–17:00 → net 9 saat.
ALTER TABLE "ShiftTemplate" ADD COLUMN "breakStart" TEXT;
ALTER TABLE "ShiftTemplate" ADD COLUMN "breakEnd" TEXT;
