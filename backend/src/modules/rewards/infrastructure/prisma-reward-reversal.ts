import { prisma } from '../../../infrastructure/database/prisma'
import { Prisma } from '@prisma/client'

export async function revertActivityReward(activityId: string, voidReason: string, tx?: Prisma.TransactionClient): Promise<number> {
  const db = tx ?? prisma
  const originalLedger = await db.rewardLedger.findFirst({
    where: {
      sourceId: activityId,
      pointsDelta: { gt: 0 },
    },
  })

  if (!originalLedger) {
    return 0
  }

  // Verificar si ya fue revertido
  const existingReversal = await db.rewardLedger.findFirst({
    where: {
      reversalOfLedgerId: originalLedger.id,
    },
  })

  if (existingReversal) {
    return 0
  }

  const pointsToDeduct = -Math.abs(originalLedger.pointsDelta)

  await db.rewardLedger.create({
    data: {
      userId: originalLedger.userId,
      eventType: `${originalLedger.eventType}.reversal`,
      ruleKey: 'activity.void.reversal',
      sourceId: activityId,
      pointsDelta: pointsToDeduct,
      reason: `Reversión por anulación de actividad: ${voidReason}`,
      reversalOfLedgerId: originalLedger.id,
    },
  })

  return pointsToDeduct
}
