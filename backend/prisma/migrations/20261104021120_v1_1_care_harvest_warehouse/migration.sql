-- CreateTable
CREATE TABLE "community_invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "communityId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PARTICIPANTE',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "community_invitations_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "care_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plantId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "care_logs_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "cultivated_plants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "care_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "harvest_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "communityId" TEXT,
    "realGardenId" TEXT NOT NULL,
    "speciesName" TEXT NOT NULL,
    "speciesLatinName" TEXT NOT NULL DEFAULT '',
    "quantity" TEXT NOT NULL,
    "harvestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "harvestedById" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "harvest_records_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "harvest_records_realGardenId_fkey" FOREIGN KEY ("realGardenId") REFERENCES "real_gardens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "harvest_records_harvestedById_fkey" FOREIGN KEY ("harvestedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "community_resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'unidades',
    "status" TEXT NOT NULL DEFAULT 'DISPONIBLE',
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "community_resources_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_community_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleInCommunity" TEXT NOT NULL DEFAULT 'PARTICIPANTE',
    "status" TEXT NOT NULL DEFAULT 'ACCEPTED',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "community_members_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "community_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_community_members" ("communityId", "id", "joinedAt", "roleInCommunity", "userId") SELECT "communityId", "id", "joinedAt", "roleInCommunity", "userId" FROM "community_members";
DROP TABLE "community_members";
ALTER TABLE "new_community_members" RENAME TO "community_members";
CREATE UNIQUE INDEX "community_members_communityId_userId_key" ON "community_members"("communityId", "userId");
CREATE TABLE "new_cultivated_plants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plotIndex" INTEGER NOT NULL,
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
    "registeredById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cultivated_plants_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "medicinal_catalog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cultivated_plants_realGardenId_fkey" FOREIGN KEY ("realGardenId") REFERENCES "real_gardens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cultivated_plants_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cultivated_plants" ("createdAt", "customName", "id", "notes", "photoMime", "photoPath", "photoSize", "photoUrl", "plantingDate", "plotIndex", "realGardenId", "registeredById", "speciesId", "updatedAt") SELECT "createdAt", "customName", "id", "notes", "photoMime", "photoPath", "photoSize", "photoUrl", "plantingDate", "plotIndex", "realGardenId", "registeredById", "speciesId", "updatedAt" FROM "cultivated_plants";
DROP TABLE "cultivated_plants";
ALTER TABLE "new_cultivated_plants" RENAME TO "cultivated_plants";
CREATE UNIQUE INDEX "cultivated_plants_realGardenId_plotIndex_key" ON "cultivated_plants"("realGardenId", "plotIndex");
CREATE TABLE "new_medicinal_catalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "latinName" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "medicinalProperties" TEXT NOT NULL DEFAULT '',
    "preparation" TEXT NOT NULL DEFAULT '',
    "contraindications" TEXT NOT NULL DEFAULT '',
    "defaultPhotoUrl" TEXT NOT NULL DEFAULT '',
    "wateringFrequencyDays" INTEGER NOT NULL DEFAULT 3,
    "fertilizerFrequencyDays" INTEGER NOT NULL DEFAULT 30,
    "growthCycleDays" INTEGER NOT NULL DEFAULT 45,
    "bestPlantingSeason" TEXT NOT NULL DEFAULT 'Todo el año',
    "lunarPhaseTip" TEXT NOT NULL DEFAULT 'Sembrar en cuarto creciente para mayor vigor foliar',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_medicinal_catalog" ("contraindications", "createdAt", "defaultPhotoUrl", "description", "icon", "id", "latinName", "medicinalProperties", "name", "preparation") SELECT "contraindications", "createdAt", "defaultPhotoUrl", "description", "icon", "id", "latinName", "medicinalProperties", "name", "preparation" FROM "medicinal_catalog";
DROP TABLE "medicinal_catalog";
ALTER TABLE "new_medicinal_catalog" RENAME TO "medicinal_catalog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
