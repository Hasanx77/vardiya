-- Şifre değişince eski oturumları geçersiz kılmak için sürüm sayacı.
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
