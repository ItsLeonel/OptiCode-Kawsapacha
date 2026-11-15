/**
 * Conciliación idempotente posterior a la migración de V1.
 * Ejecutar después de: npx prisma migrate deploy
 * Nunca borra ledger, evidencias ni actividad y respeta límites diarios.
 */
import { prisma } from '../src/infrastructure/database/prisma'
import { BASE_POINTS, evaluateActivityReward } from '../src/modules/rewards/application/rewards.service'
import { syncUserMissionsAndBadges } from '../src/modules/rewards/application/missions.service'

async function main() {
  const activities = await prisma.gardenActivity.findMany({
    where: { reviewStatus: 'APPROVED', voidedAt: null },
    orderBy: [{ performedDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      actorUserId: true,
      type: true,
      performedDate: true,
      targetKind: true,
      plantId: true,
      plotIndex: true,
    },
  })
  const users = new Set<string>()
  let credits = 0
  let awardedPoints = 0
  for (const activity of activities) {
    users.add(activity.actorUserId)
    if ((BASE_POINTS[activity.type as keyof typeof BASE_POINTS] ?? 0) <= 0) continue
    const result = await evaluateActivityReward({
      id: activity.id,
      actorUserId: activity.actorUserId,
      type: activity.type,
      performedDate: activity.performedDate,
      targetKind: activity.targetKind,
      plantId: activity.plantId,
      plotIndex: activity.plotIndex,
    })
    if (result.awarded) {
      credits += 1
      awardedPoints += result.pointsAwarded
    }
  }
  for (const userId of users) await syncUserMissionsAndBadges(userId)
  console.info(`Conciliación V1 completada: ${activities.length} actividades válidas, ${users.size} usuarios, ${credits} créditos nuevos, ${awardedPoints} Semillas nuevas.`)
}

void main()
  .catch(error => {
    console.error('No se pudo conciliar el ledger V1:', error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
