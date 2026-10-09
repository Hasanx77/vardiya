-- CreateTable
CREATE TABLE "OpenShift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "shiftTemplateId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OpenShift_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OpenShift_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "ShiftTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShiftTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'sky',
    "minStaff" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ShiftTemplate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ShiftTemplate" ("businessId", "color", "end", "id", "name", "start") SELECT "businessId", "color", "end", "id", "name", "start" FROM "ShiftTemplate";
DROP TABLE "ShiftTemplate";
ALTER TABLE "new_ShiftTemplate" RENAME TO "ShiftTemplate";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
