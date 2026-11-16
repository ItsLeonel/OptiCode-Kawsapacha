-- Additive only: all existing communities, gardens and relations are preserved.
ALTER TABLE "communities" ADD COLUMN "province" TEXT;
ALTER TABLE "communities" ADD COLUMN "cantonCode" TEXT;
ALTER TABLE "communities" ADD COLUMN "parishCode" TEXT;
ALTER TABLE "communities" ADD COLUMN "sector" TEXT;
ALTER TABLE "communities" ADD COLUMN "photoUrl" TEXT;
ALTER TABLE "real_gardens" ADD COLUMN "photoUrl" TEXT;
