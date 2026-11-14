-- Fase 4.5: Moderación MSP, roles administrativos, auditoría, notificaciones, reglas dinámicas y estado de Espejo Digital V2.
-- Migración aditiva segura: conserva usuarios, comunidades, huertos, plantas y actividades existentes.

-- AlterTable: users
ALTER TABLE "users" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: communities
ALTER TABLE "communities" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'personal';
ALTER TABLE "communities" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "communities" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "communities" ADD COLUMN "reviewReason" TEXT;
ALTER TABLE "communities" ADD COLUMN "reviewedAt" DATETIME;

-- AlterTable: cultivated_plants
ALTER TABLE "cultivated_plants" ADD COLUMN "observedState" TEXT NOT NULL DEFAULT 'not-documented';
ALTER TABLE "cultivated_plants" ADD COLUMN "archivedAt" DATETIME;
ALTER TABLE "cultivated_plants" ADD COLUMN "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable: garden_activities
ALTER TABLE "garden_activities" ADD COLUMN "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "garden_activities" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "garden_activities" ADD COLUMN "reviewReason" TEXT;
ALTER TABLE "garden_activities" ADD COLUMN "reviewedAt" DATETIME;

-- AlterTable: reward_ledgers
ALTER TABLE "reward_ledgers" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'CONFIRMED';
ALTER TABLE "reward_ledgers" ADD COLUMN "ruleVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable: notifications
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resourceId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: audit_logs
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetResource" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "details" TEXT NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable: reward_rules
CREATE TABLE "reward_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityType" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "dailyCap" INTEGER NOT NULL DEFAULT 50,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: mission_definitions
CREATE TABLE "mission_definitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🎯',
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable: msp_institutional_events
CREATE TABLE "msp_institutional_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "date" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'Pichincha',
    "canton" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'NACIONAL',
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable: msp_educational_resources
CREATE TABLE "msp_educational_resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'GUIA',
    "fileUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "garden_activities_reviewStatus_idx" ON "garden_activities"("reviewStatus");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "audit_logs_targetResource_targetId_idx" ON "audit_logs"("targetResource", "targetId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_timestamp_idx" ON "audit_logs"("actorId", "timestamp");

-- CreateIndex
CREATE INDEX "reward_rules_activityType_isActive_idx" ON "reward_rules"("activityType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "mission_definitions_code_key" ON "mission_definitions"("code");
