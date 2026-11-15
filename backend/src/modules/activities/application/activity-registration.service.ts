import { prisma } from '../../../infrastructure/database/prisma'
import { harvestPlant } from '../../harvest/application/harvest.service'
import { evaluateActivityReward } from '../../rewards/application/rewards.service'
import { syncUserMissionsAndBadges } from '../../rewards/application/missions.service'
import { validateCareAction } from './care.service'
import { assertGardenAccess } from './activity-access.service'
import type { CreateActivityInput } from './activity-input'
import { VALID_ACTIVITY_TYPES } from '../domain/activity-types'

export async function createGardenActivity(input: CreateActivityInput) {
  const {
    gardenId,
    actorUserId,
    type,
    performedDate,
    notes = '',
    details = {},
    clientActivityId,
    evidenceFile,
  } = input
  let targetKind = input.targetKind
  let plantId = input.plantId
  let plotIndex = input.plotIndex

  // 1. Validar acceso al huerto
  await assertGardenAccess(gardenId, actorUserId)

  // 2. Validar tipo de actividad
  if (!VALID_ACTIVITY_TYPES.includes(type)) {
    throw new Error(`Tipo de actividad inválido: "${type}".`)
  }

  // La etapa del Espejo Digital solo puede declararse con evidencia real;
  // esta regla debe vivir también en el servidor, no solo en React.
  if (type === 'observation' && (details.growthStage !== undefined || details.visualProfile !== undefined) && !evidenceFile) {
    throw Object.assign(new Error('Para documentar una etapa o perfil visual, adjunta una fotografía real.'), { code: 'EVIDENCE_REQUIRED' })
  }

  // 3. Validar fecha (formato y no futura considerando hora de Ecuador UTC-5)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(performedDate)) {
    throw new Error(`Fecha realizada inválida: "${performedDate}". Debe ser formato YYYY-MM-DD.`)
  }
  const todayEcuador = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const todayUtc = new Date().toISOString().slice(0, 10)
  const maxAllowedDate = todayEcuador > todayUtc ? todayEcuador : todayUtc
  if (performedDate > maxAllowedDate) {
    throw new Error('La fecha de la actividad no puede ser posterior al día de hoy.')
  }

  // 4. Idempotencia: si ya existe una actividad con el clientActivityId, devolverla
  if (clientActivityId) {
    const existing = await prisma.gardenActivity.findUnique({
      where: { clientActivityId },
      include: { evidences: true, actorUser: { select: { id: true, name: true, email: true } } },
    })
    if (existing) {
      if (existing.gardenId !== gardenId || existing.actorUserId !== actorUserId) {
        throw Object.assign(new Error('El identificador de actividad ya pertenece a otra operación o cuenta.'), { code: 'ACTIVITY_ID_CONFLICT' })
      }
      return { activity: existing, isDuplicate: true, reward: null }
    }
  }

  // 5. Validar objetivo según tipo de actividad (Espacios sembrados vs no sembrados)
  const isPlantCareType = ['watering', 'fertilizing', 'weeding', 'hilling', 'harvest'].includes(type)
  let plantRecord = null

  if (isPlantCareType) {
    if (targetKind === 'plot') {
      if (plotIndex === null || plotIndex === undefined || plotIndex < 0 || plotIndex >= 6) {
        throw new Error('Índice de parcela inválido (debe ser entre 0 y 5).')
      }
      // Verificar si hay una planta viva en esa parcela
      const plantInPlot = await prisma.cultivatedPlant.findFirst({
        where: { realGardenId: gardenId, plotIndex, archivedAt: null, lifecycleStatus: { not: 'REMOVED' } },
        include: { species: true },
      })
      if (!plantInPlot) {
        throw new Error('Ese espacio no tiene una planta sembrada. En espacios vacíos solo se permite la preparación del terreno.')
      }
      // La siembra PENDING ya existe en el huerto: sus cuidados no esperan revisión MSP.
      targetKind = 'plant'
      plantId = plantInPlot.id
      plantRecord = plantInPlot
    } else if (targetKind === 'garden') {
      throw new Error('Los cuidados del cultivo (riego, abonado, limpieza, aporque o cosecha) deben aplicarse a una planta específica, no a todo el huerto.')
    } else if (targetKind === 'plant') {
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
      if (plantRecord.archivedAt || plantRecord.lifecycleStatus === 'REMOVED') {
        throw new Error('La planta seleccionada no se encuentra activa en el huerto.')
      }
      // El estado de verificación de la siembra no impide registrar cuidados.
      plotIndex = plantRecord.plotIndex
    }
  } else if (type === 'preparation') {
    if (targetKind === 'plant') {
      throw new Error('No se puede preparar el terreno en una parcela que ya tiene una planta sembrada.')
    } else if (targetKind === 'plot') {
      if (plotIndex === null || plotIndex === undefined || plotIndex < 0 || plotIndex >= 6) {
        throw new Error('Índice de parcela inválido (debe ser entre 0 y 5).')
      }
      const plantInPlot = await prisma.cultivatedPlant.findFirst({
        where: { realGardenId: gardenId, plotIndex, archivedAt: null, lifecycleStatus: { not: 'REMOVED' } },
      })
      if (plantInPlot) {
        throw new Error('Ese espacio ya tiene una planta sembrada. No se puede realizar preparación del terreno.')
      }
    }
  } else if (targetKind === 'plant') {
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
    if (plantRecord.archivedAt || plantRecord.lifecycleStatus === 'REMOVED') {
      throw new Error('La planta seleccionada no se encuentra activa en el huerto.')
    }
    if (type === 'sowing') {
      throw Object.assign(
        new Error(`El Espacio ${(plantRecord.plotIndex ?? 0) + 1} ya está ocupado por «${plantRecord.customName || plantRecord.species.name}».`),
        { code: 'PLOT_OCCUPIED' }
      )
    }
    plotIndex = plantRecord.plotIndex
  } else if (targetKind === 'plot') {
    if (plotIndex === null || plotIndex === undefined || plotIndex < 0 || plotIndex >= 6) {
      throw new Error('Índice de parcela inválido (debe ser entre 0 y 5).')
    }
    const plantInPlot = await prisma.cultivatedPlant.findFirst({
      where: { realGardenId: gardenId, plotIndex, archivedAt: null, lifecycleStatus: { not: 'REMOVED' } },
      include: { species: true },
    })
    if (plantInPlot) {
      if (type === 'sowing') {
        throw Object.assign(
          new Error(`El Espacio ${plotIndex + 1} ya está ocupado por una planta activa.`),
          { code: 'PLOT_OCCUPIED' }
        )
      }
    }
  } else if (type === 'sowing') {
    throw new Error('La siembra debe registrarse en un espacio o planta específica del huerto.')
  }

  // No impedir nuevas actividades porque una anterior siga PENDING.
  // La idempotencia por clientActivityId, los límites diarios de recompensas
  // y la validación de frecuencia de cuidados siguen protegiendo de duplicados.

  // 6. Sincronización con cuidados y cosechas existentes
  let linkedCareLogId: string | null = null
  let linkedHarvestRecordId: string | null = null

  if (targetKind === 'plant' && plantId) {
    // Si es riego, abonado o limpieza/mantenimiento, registrar CareLog para que se actualice la salud y alertas del huerto
    if (type === 'watering' || type === 'fertilizing' || type === 'weeding') {
      const actionType = type === 'watering' ? 'WATERING' : type === 'fertilizing' ? 'FERTILIZER' : 'PRUNING'

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
          plantingDate: plantForCare.plantingDate,
          lastHarvestDate: plantForCare.lastHarvestDate,
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
    } else if (type === 'hilling') {
      // Validar que no se repita aporque en los últimos 7 días
      const recentHilling = await prisma.gardenActivity.findFirst({
        where: {
          plantId,
          type: 'hilling',
          voidedAt: null,
          performedDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          },
        },
      })
      if (recentHilling) {
        throw Object.assign(
          new Error('La planta ya cuenta con aporque reciente en su base. El exceso de aporque puede compactar la tierra o cubrir tallos tiernos.'),
          { code: 'CARE_OVERUSE' }
        )
      }
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
      reviewStatus: 'APPROVED', // Válida al registrarse; reviewedAt null hasta una auditoría MSP.
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

  // La actividad queda activa y sus Semillas se acreditan de inmediato.
  // El MSP puede verificarla después sin duplicar los puntos, o invalidarla y revertirlos.
  const reward = await evaluateActivityReward({
    id: activity.id,
    actorUserId,
    type,
    performedDate,
    targetKind,
    plantId: activity.plantId,
    plotIndex: activity.plotIndex,
  })
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
