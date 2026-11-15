import { prisma } from '../../../infrastructure/database/prisma'
import { revertActivityReward } from '../../rewards/application/rewards.service'
import { syncUserMissionsAndBadges } from '../../rewards/application/missions.service'

export async function voidGardenActivity(activityId: string, userId: string, voidReason: string) {
  if (!voidReason || voidReason.trim().length < 3) {
    throw new Error('Debe proporcionar un motivo válido de anulación (mínimo 3 caracteres).')
  }

  const activity = await prisma.gardenActivity.findUnique({
    where: { id: activityId },
    include: { garden: true },
  })

  if (!activity) {
    throw new Error('Actividad no encontrada.')
  }

  if (activity.voidedAt) {
    throw new Error('Esta actividad ya ha sido anulada previamente.')
  }

  // Permiso para anular: el autor de la actividad o el creador del huerto
  if (activity.actorUserId !== userId && activity.garden.createdById !== userId) {
    throw new Error('Solo el autor de la actividad o el responsable del huerto pueden anularla.')
  }

  // Anulación y reversión forman una sola transacción: nunca descontar puntos a medias.
  const { updatedActivity, pointsReverted } = await prisma.$transaction(async tx => {
    const changed = await tx.gardenActivity.updateMany({
      where: { id: activityId, voidedAt: null },
      data: { voidedAt: new Date(), voidReason, voidedByUserId: userId },
    })
    if (changed.count !== 1) {
      throw Object.assign(new Error('Esta actividad ya fue anulada.'), { code: 'ACTIVITY_VOIDED' })
    }
    const pointsReverted = await revertActivityReward(activityId, voidReason, tx)
    const updatedActivity = await tx.gardenActivity.findUniqueOrThrow({
      where: { id: activityId },
      include: {
        evidences: true,
        actorUser: { select: { id: true, name: true, email: true } },
      },
    })
    return { updatedActivity, pointsReverted }
  })

  // Re-sincronizar misiones e insignias del usuario autor
  await syncUserMissionsAndBadges(activity.actorUserId)

  return {
    activity: updatedActivity,
    pointsReverted,
  }
}
