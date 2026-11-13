// backend/src/services/activity.service.ts
// Responsable: Ronny Veloz (Rodni15)
// Bitácora Viva: Servicio de registro, consulta y anulación de actividades agrícolas con evidencias

import { prisma } from '../config/prisma'
import { harvestPlant } from './harvest.service'
import { evaluateActivityReward, revertActivityReward } from './rewards.service'
import { syncUserMissionsAndBadges } from './missions.service'
import { validateCareAction } from './care.service'

export const VALID_ACTIVITY_TYPES = [
  'preparation',
  'weeding',
  'sowing',
  'watering',
  'fertilizing',
  'hilling',
  'replanting',
  'observation',
  'harvest',
] as const

export type ActivityType = typeof VALID_ACTIVITY_TYPES[number]

export interface CreateActivityInput {
  gardenId: string
  actorUserId: string
  type: ActivityType
  performedDate: string // YYYY-MM-DD
  targetKind: 'garden' | 'plot' | 'plant'
  plantId?: string | null
  plotIndex?: number | null
  notes?: string
  details?: Record<string, unknown>
  clientActivityId?: string | null
  evidenceFile?: {
    filename: string
    path: string
    mimetype: string
    size: number
  } | null
}

/**
 * Valida que el usuario tenga permiso de registrar o consultar actividades en el huerto.
 */
export async function assertGardenAccess(gardenId: string, userId: string): Promise<boolean> {
  const garden = await prisma.realGarden.findUnique({
    where: { id: gardenId },
    select: { id: true, createdById: true, communityId: true },
  })

  if (!garden) {
    throw new Error('El huerto especificado no existe.')
  }

  // Creador del huerto
  if (garden.createdById === userId) {
    return true
  }

  // Si pertenece a una comunidad, verificar si el usuario es miembro activo
  if (garden.communityId) {
    const member = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: garden.communityId,
          userId,
        },
      },
    })
    if (member && member.status === 'ACCEPTED') {
      return true
    }
  }

  throw new Error('No tienes permisos para interactuar con este huerto.')
}

/**
 * Registra una actividad agrícola en la Bitácora Viva con idempotencia, sincronización y recompensas.
 */
export async function createGardenActivity(input: CreateActivityInput) {
  const {
    gardenId,
    actorUserId,
    type,
    performedDate,
    targetKind,
    plantId,
    plotIndex,
    notes = '',
    details = {},
    clientActivityId,
    evidenceFile,
  } = input

  // 1. Validar acceso al huerto
  await assertGardenAccess(gardenId, actorUserId)

  // 2. Validar tipo de actividad
  if (!VALID_ACTIVITY_TYPES.includes(type)) {
    throw new Error(`Tipo de actividad inválido: "${type}".`)
  }

  // 3. Validar fecha (formato y no futura)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(performedDate)) {
    throw new Error(`Fecha realizada inválida: "${performedDate}". Debe ser formato YYYY-MM-DD.`)
  }
  const todayStr = new Date().toISOString().slice(0, 10)
  if (performedDate > todayStr) {
    throw new Error('La fecha de la actividad no puede ser posterior al día de hoy.')
  }

  // 4. Idempotencia: si ya existe una actividad con el clientActivityId, devolverla
  if (clientActivityId) {
    const existing = await prisma.gardenActivity.findUnique({
      where: { clientActivityId },
      include: { evidences: true, actorUser: { select: { id: true, name: true, email: true } } },
    })
    if (existing) {
      return { activity: existing, isDuplicate: true, reward: null }
    }
  }

  // 5. Validar objetivo y planta
  let plantRecord = null
  if (targetKind === 'plant') {
    if (!plantId) {
      throw new Error('Se requiere especificar plantId cuando el objetivo es una planta.')
    }
    plantRecord = await prisma.cultivatedPlant.findUnique({
      where: { id: plantId },
      include: { species: true },
    })
    if (!plantRecord || plantRecord.realGardenId !== gardenId) {
      throw new Error('La planta seleccionada no pertenece a este huerto.')
    }
    if (plantRecord.archivedAt) {
      throw new Error('La planta seleccionada se encuentra archivada.')
    }
  } else if (targetKind === 'plot') {
    if (plotIndex === null || plotIndex === undefined || plotIndex < 0 || plotIndex >= 6) {
      throw new Error('Índice de parcela inválido (debe ser entre 0 y 5).')
    }
  }

  // 6. Sincronización con cuidados y cosechas existentes
  let linkedCareLogId: string | null = null
  let linkedHarvestRecordId: string | null = null

  if (targetKind === 'plant' && plantId) {
    // Si es riego o abonado, registrar CareLog para que se actualice la salud y alertas del huerto
    if (type === 'watering' || type === 'fertilizing') {
      const actionType = type === 'watering' ? 'WATERING' : 'FERTILIZER'

      // Validar sobrecuidado antes de registrar el cuidado
      const plantForCare = await prisma.cultivatedPlant.findUnique({
        where: { id: plantId },
        include: { species: true, careLogs: true },
      })
      if (plantForCare) {
        const careValidation = await validateCareAction(plantId, actionType, {
          lifecycleStatus: plantForCare.lifecycleStatus,
          species: plantForCare.species,
          careLogs: plantForCare.careLogs,
        })
        if (!careValidation.allowed) {
          throw Object.assign(new Error(careValidation.warningMessage), { code: 'CARE_OVERUSE' })
        }
      }

      const careLog = await prisma.careLog.create({
        data: {
          plantId,
          actionType,
          notes: notes || `Registrado desde Bitácora Viva (${type})`,
          userId: actorUserId,
          performedAt: new Date(performedDate + 'T12:00:00.000Z'),
        },
      })
      linkedCareLogId = careLog.id
    }

    // Si es cosecha, invocar la lógica existente de cosecha (bodega + estado de planta)
    if (type === 'harvest') {
      const quantityStr = typeof details.quantity === 'number'
        ? `${details.quantity} ${details.unit || 'unidades'}`
        : '1 cosecha'
      const harvestRecord = await harvestPlant(
        plantId,
        quantityStr,
        notes || 'Cosecha registrada desde Bitácora Viva',
        actorUserId
      )
      linkedHarvestRecordId = harvestRecord.id
    }
  }

  // 7. Persistir la actividad en la base de datos
  const activity = await prisma.gardenActivity.create({
    data: {
      gardenId,
      actorUserId,
      type,
      performedDate,
      targetKind,
      plantId: targetKind === 'plant' ? plantId : null,
      plotIndex: targetKind === 'plot' ? plotIndex : (plantRecord ? plantRecord.plotIndex : null),
      notes: notes.slice(0, 2000),
      details: JSON.stringify(details),
      clientActivityId: clientActivityId || null,
      careLogId: linkedCareLogId,
      harvestRecordId: linkedHarvestRecordId,
    },
  })

  // 8. Si se adjuntó fotografía de evidencia, persistirla
  if (evidenceFile) {
    await prisma.activityEvidence.create({
      data: {
        activityId: activity.id,
        filePath: evidenceFile.path,
        fileUrl: `/uploads/activities/${evidenceFile.filename}`,
        mimeType: evidenceFile.mimetype,
        fileSize: evidenceFile.size,
      },
    })
  }

  // 9. Evaluar y otorgar recompensa en Semillas de Vida
  const reward = await evaluateActivityReward({
    id: activity.id,
    actorUserId,
    type,
    performedDate,
    targetKind,
    plantId: activity.plantId,
    plotIndex: activity.plotIndex,
  })

  // 10. Actualizar misiones e insignias del usuario
  await syncUserMissionsAndBadges(actorUserId)

  // 11. Retornar actividad completa con evidencias
  const fullActivity = await prisma.gardenActivity.findUnique({
    where: { id: activity.id },
    include: {
      evidences: true,
      actorUser: { select: { id: true, name: true, email: true } },
      plant: { select: { id: true, customName: true, plotIndex: true, species: true } },
    },
  })

  return {
    activity: fullActivity,
    isDuplicate: false,
    reward,
  }
}

/**
 * Recupera el listado de actividades de un huerto con filtros y orden cronológico descendente.
 */
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
  await assertGardenAccess(gardenId, userId)

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

/**
 * Obtiene el detalle de una actividad específica.
 */
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

/**
 * Anula una actividad, revierte sus recompensas y actualiza misiones.
 */
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

  // Marcar como anulada
  const updatedActivity = await prisma.gardenActivity.update({
    where: { id: activityId },
    data: {
      voidedAt: new Date(),
      voidReason,
      voidedByUserId: userId,
    },
    include: {
      evidences: true,
      actorUser: { select: { id: true, name: true, email: true } },
    },
  })

  // Revertir recompensas en el ledger
  const pointsReverted = await revertActivityReward(activityId, voidReason)

  // Re-sincronizar misiones e insignias del usuario autor
  await syncUserMissionsAndBadges(activity.actorUserId)

  return {
    activity: updatedActivity,
    pointsReverted,
  }
}

