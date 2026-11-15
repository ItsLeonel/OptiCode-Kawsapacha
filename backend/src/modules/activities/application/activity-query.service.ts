import { prisma } from '../../../infrastructure/database/prisma'
import { assertGardenAccess } from './activity-access.service'
import { VALID_ACTIVITY_TYPES, type ActivityType } from '../domain/activity-types'

export async function listGardenActivities(
  gardenId: string,
  userId: string,
  filters: {
    plantId?: string
    type?: string
    from?: string
    to?: string
    includeVoided?: boolean
  }
) {
  await assertGardenAccess(gardenId, userId, { requireApproved: false })

  const whereClause: Record<string, unknown> = {
    gardenId,
  }

  if (!filters.includeVoided) {
    whereClause.voidedAt = null
  }

  if (filters.plantId) {
    whereClause.plantId = filters.plantId
  }

  if (filters.type && VALID_ACTIVITY_TYPES.includes(filters.type as ActivityType)) {
    whereClause.type = filters.type
  }

  if (filters.from || filters.to) {
    whereClause.performedDate = {}
    if (filters.from) {
      (whereClause.performedDate as Record<string, string>).gte = filters.from
    }
    if (filters.to) {
      (whereClause.performedDate as Record<string, string>).lte = filters.to
    }
  }

  const activities = await prisma.gardenActivity.findMany({
    where: whereClause,
    include: {
      evidences: true,
      actorUser: { select: { id: true, name: true, email: true } },
      plant: { select: { id: true, customName: true, plotIndex: true, species: true } },
    },
    orderBy: [
      { performedDate: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  return activities
}

export async function getGardenActivityDetail(activityId: string, userId: string) {
  const activity = await prisma.gardenActivity.findUnique({
    where: { id: activityId },
    include: {
      evidences: true,
      actorUser: { select: { id: true, name: true, email: true } },
      plant: { select: { id: true, customName: true, plotIndex: true, species: true } },
    },
  })

  if (!activity) {
    throw new Error('Actividad no encontrada.')
  }

  await assertGardenAccess(activity.gardenId, userId)

  return activity
}
