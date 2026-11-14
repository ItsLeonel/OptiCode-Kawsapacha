-- Ampliación aditiva: no se eliminan especies, fotos, relaciones ni registros cultivados.
-- Galápagos: presencia documentada no constituye permiso de ingreso/cultivo.
ALTER TABLE "medicinal_catalog" ADD COLUMN "otherNames" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "medicinal_catalog" ADD COLUMN "family" TEXT NOT NULL DEFAULT '';
ALTER TABLE "medicinal_catalog" ADD COLUMN "altitude" TEXT NOT NULL DEFAULT '';
ALTER TABLE "medicinal_catalog" ADD COLUMN "provinces" TEXT NOT NULL DEFAULT '';
ALTER TABLE "medicinal_catalog" ADD COLUMN "regions" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "medicinal_catalog" ADD COLUMN "usageTags" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "medicinal_catalog" ADD COLUMN "cycleCategory" TEXT NOT NULL DEFAULT '';
ALTER TABLE "medicinal_catalog" ADD COLUMN "traditionalClassification" TEXT NOT NULL DEFAULT '';
ALTER TABLE "medicinal_catalog" ADD COLUMN "careNotes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "medicinal_catalog" ADD COLUMN "sourceLabel" TEXT NOT NULL DEFAULT '';
ALTER TABLE "medicinal_catalog" ADD COLUMN "sourceUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "medicinal_catalog" ADD COLUMN "regionalNote" TEXT NOT NULL DEFAULT '';
ALTER TABLE "medicinal_catalog" ADD COLUMN "registerStatus" TEXT NOT NULL DEFAULT 'DOCUMENTADA';
ALTER TABLE "medicinal_catalog" ADD COLUMN "photoSourceUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "medicinal_catalog" ADD COLUMN "photoCredit" TEXT NOT NULL DEFAULT '';
