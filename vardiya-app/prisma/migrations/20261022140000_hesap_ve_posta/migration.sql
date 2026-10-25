-- Kullanici adi (e-posta yerine gorunen ad), e-posta dogrulama ve Google ile giris.
ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- Sifre sifirlama anahtarlari (ham anahtar saklanmaz, SHA-256 ozeti tutulur).
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PasswordReset_tokenHash_key" ON "PasswordReset"("tokenHash");
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");
