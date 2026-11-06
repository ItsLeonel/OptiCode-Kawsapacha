-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PARTICIPANTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "communities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "communities_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "community_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleInCommunity" TEXT NOT NULL DEFAULT 'PARTICIPANTE',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "community_members_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "community_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "real_gardens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "areaM2" REAL NOT NULL,
    "province" TEXT NOT NULL,
    "provinceCode" TEXT NOT NULL,
    "canton" TEXT NOT NULL DEFAULT '',
    "cantonCode" TEXT,
    "parish" TEXT NOT NULL DEFAULT '',
    "parishCode" TEXT,
    "reference" TEXT NOT NULL DEFAULT '',
    "latitude" REAL,
    "longitude" REAL,
    "irrigationAvailability" TEXT NOT NULL DEFAULT 'unknown',
    "soilType" TEXT,
    "communityId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "real_gardens_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "real_gardens_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medicinal_catalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "latinName" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "medicinalProperties" TEXT NOT NULL DEFAULT '',
    "preparation" TEXT NOT NULL DEFAULT '',
    "contraindications" TEXT NOT NULL DEFAULT '',
    "defaultPhotoUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "cultivated_plants" (
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
    "registeredById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cultivated_plants_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "medicinal_catalog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cultivated_plants_realGardenId_fkey" FOREIGN KEY ("realGardenId") REFERENCES "real_gardens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cultivated_plants_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "community_members_communityId_userId_key" ON "community_members"("communityId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "cultivated_plants_realGardenId_plotIndex_key" ON "cultivated_plants"("realGardenId", "plotIndex");
