-- V1: actividades agrícolas válidas desde el registro, sin aprobación MSP previa.
-- Migración de datos no destructiva. Se preservan decisiones humanas, evidencias y movimientos del ledger.
-- reviewedAt/reviewedById permanecen NULL para distinguir la aprobación automática de una auditoría humana.
UPDATE "garden_activities"
SET "reviewStatus" = 'APPROVED'
WHERE "reviewStatus" = 'PENDING'
  AND "reviewedById" IS NULL
  AND "reviewedAt" IS NULL
  AND "voidedAt" IS NULL;

UPDATE "cultivated_plants"
SET "reviewStatus" = 'APPROVED'
WHERE "reviewStatus" = 'PENDING'
  AND NOT EXISTS (
    SELECT 1 FROM "garden_activities" AS "a"
    WHERE "a"."plantId" = "cultivated_plants"."id"
      AND "a"."type" = 'sowing'
      AND (
        "a"."reviewStatus" IN ('REJECTED', 'NEEDS_CHANGES')
        OR ("a"."reviewStatus" = 'PENDING' AND "a"."reviewedById" IS NOT NULL)
      )
  );

-- La comunidad conserva su estado PENDING y requiere decisión MSP.
-- Las columnas siguen usando default histórico PENDING para escrituras antiguas
-- fuera de los servicios: las altas de V1 fijan APPROVED explícitamente.
