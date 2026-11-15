-- AlterTable
ALTER TABLE "real_gardens" ADD COLUMN "characteristics" TEXT DEFAULT '{}';

-- CreateTable
CREATE TABLE "garden_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gardenId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "performedDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetKind" TEXT NOT NULL,
    "plantId" TEXT,
    "plotIndex" INTEGER,
    "notes" TEXT NOT NULL DEFAULT '',
    "details" TEXT NOT NULL DEFAULT '{}',
    "clientActivityId" TEXT,
    "voidedAt" DATETIME,
    "voidReason" TEXT,
    "voidedByUserId" TEXT,
    "careLogId" TEXT,
    "harvestRecordId" TEXT,
    CONSTRAINT "garden_activities_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "real_gardens" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "garden_activities_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "garden_activities_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "cultivated_plants" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "garden_activities_careLogId_fkey" FOREIGN KEY ("careLogId") REFERENCES "care_logs" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "garden_activities_harvestRecordId_fkey" FOREIGN KEY ("harvestRecordId") REFERENCES "harvest_records" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_evidences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_evidences_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "garden_activities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reward_ledgers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "pointsDelta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "awardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversalOfLedgerId" TEXT,
    CONSTRAINT "reward_ledgers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_mission_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "targetValue" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_mission_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "garden_activities_clientActivityId_key" ON "garden_activities"("clientActivityId");

-- CreateIndex
CREATE INDEX "garden_activities_gardenId_performedDate_idx" ON "garden_activities"("gardenId", "performedDate");

-- CreateIndex
CREATE INDEX "garden_activities_actorUserId_idx" ON "garden_activities"("actorUserId");

-- CreateIndex
CREATE INDEX "reward_ledgers_userId_awardedAt_idx" ON "reward_ledgers"("userId", "awardedAt");

-- CreateIndex
CREATE UNIQUE INDEX "reward_ledgers_userId_eventType_sourceId_key" ON "reward_ledgers"("userId", "eventType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "user_mission_progress_userId_missionId_key" ON "user_mission_progress"("userId", "missionId");

