-- RedefineTables: hacer plotIndex nullable en cultivated_plants para permitir archivar plantas y liberar parcelas sin perder historial ni relaciones.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cultivated_plants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plotIndex" INTEGER,
    "speciesId" TEXT NOT NULL,
    "realGardenId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL DEFAULT '',
    "photoPath" TEXT NOT NULL DEFAULT '',
    "photoMime" TEXT NOT NULL DEFAULT '',
    "photoSize" INTEGER NOT NULL DEFAULT 0,
    "customName" TEXT NOT NULL DEFAULT '',
    "plantingDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT NOT NULL DEFAULT '',
    "lifecycleStatus" TEXT NOT NULL DEFAULT 'GROWING',
    "observedState" TEXT NOT NULL DEFAULT 'not-documented',
    "lastHarvestDate" DATETIME,
    "archivedAt" DATETIME,
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "registeredById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cultivated_plants_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "medicinal_catalog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cultivated_plants_realGardenId_fkey" FOREIGN KEY ("realGardenId") REFERENCES "real_gardens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cultivated_plants_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cultivated_plants" (
    "id",
    "plotIndex",
    "speciesId",
    "realGardenId",
    "photoUrl",
    "photoPath",
    "photoMime",
    "photoSize",
    "customName",
    "plantingDate",
    "notes",
    "lifecycleStatus",
    "observedState",
    "lastHarvestDate",
    "archivedAt",
    "reviewStatus",
    "registeredById",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "plotIndex",
    "speciesId",
    "realGardenId",
    "photoUrl",
    "photoPath",
    "photoMime",
    "photoSize",
    "customName",
    "plantingDate",
    "notes",
    "lifecycleStatus",
    "observedState",
    "lastHarvestDate",
    "archivedAt",
    "reviewStatus",
    "registeredById",
    "createdAt",
    "updatedAt"
FROM "cultivated_plants";
DROP TABLE "cultivated_plants";
ALTER TABLE "new_cultivated_plants" RENAME TO "cultivated_plants";
CREATE UNIQUE INDEX "cultivated_plants_realGardenId_plotIndex_key" ON "cultivated_plants"("realGardenId", "plotIndex");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
