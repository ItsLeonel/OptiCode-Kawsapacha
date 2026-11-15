import { prisma } from '../config/prisma'
import path from 'path'
import { assertGardenAccess } from './activity.service'
import { evaluateActivityReward } from './rewards.service'

const MAX_PLOTS = 6

export interface RegisterPlantInput {
  realGardenId: string
  speciesId: string
  plotIndex: number
  customName: string
  notes: string
  plantedOn?: string
  growthStage?: string
  registeredById: string
  file: Express.Multer.File
}

export async function registerPlant(input: RegisterPlantInput) {
  // La autenticación no garantiza pertenencia: impedir siembra sobre huertos ajenos.
  await assertGardenAccess(input.realGardenId, input.registeredById)
  // Validar rango de parcela
  if (input.plotIndex < 0 || input.plotIndex >= MAX_PLOTS) {
    throw Object.assign(new Error(`La parcela debe estar entre 0 y ${MAX_PLOTS - 1}.`), { code: 'INVALID_PLOT' })
  }

  // Verificar que la parcela esté libre (si estaba cosechada/archivada/removida, liberar la parcela)
  const existing = await prisma.cultivatedPlant.findUnique({
    where: { realGardenId_plotIndex: { realGardenId: input.realGardenId, plotIndex: input.plotIndex } },
  })
  if (existing) {
    if (existing.lifecycleStatus === 'HARVESTED') {
      // Liberar la parcela sin destruir la historia fotográfica, cosecha ni cuidados.
      await prisma.cultivatedPlant.update({
        where: { id: existing.id },
        data: { plotIndex: null, lifecycleStatus: 'ARCHIVED', archivedAt: new Date() },
      })
    } else if (existing.reviewStatus === 'PENDING' || existing.reviewStatus === 'NEEDS_CHANGES') {
      throw Object.assign(
        new Error(
          `El Espacio ${input.plotIndex + 1} ya tiene sembrada la planta «${existing.customName || 'sin nombre'}». Puedes registrar sus cuidados mientras el MSP revisa su evidencia, pero no sembrar otra planta en esa parcela.`
        ),
        { code: 'PLOT_OCCUPIED' }
      )
    } else {
      throw Object.assign(
        new Error(`El Espacio ${input.plotIndex + 1} ya está ocupado. Elige otro espacio disponible.`),
        { code: 'PLOT_OCCUPIED' }
      )
    }
  }

  // assertGardenAccess ya verificó existencia y permisos; PENDING no bloquea siembra.

  // Verificar que la especie existe
  const species = await prisma.medicinalCatalog.findUnique({ where: { id: input.speciesId } })
  if (!species) throw Object.assign(new Error('La especie no está en el catálogo.'), { code: 'SPECIES_NOT_FOUND' })

  // Construir URL pública de la foto
  const filename = path.basename(input.file.path)
  const photoUrl = `/uploads/plants/${filename}`

  const parsedPlantingDate = input.plantedOn && /^\d{4}-\d{2}-\d{2}$/.test(input.plantedOn)
    ? new Date(input.plantedOn + 'T12:00:00.000Z')
    : undefined

  const createdPlant = await prisma.cultivatedPlant.create({
    data: {
      realGardenId: input.realGardenId,
      speciesId: input.speciesId,
      plotIndex: input.plotIndex,
      customName: input.customName,
      notes: input.notes,
      ...(parsedPlantingDate && !isNaN(parsedPlantingDate.getTime()) ? { plantingDate: parsedPlantingDate } : {}),
      registeredById: input.registeredById,
      photoUrl,
      photoPath: input.file.path,
      photoMime: input.file.mimetype,
      photoSize: input.file.size,
      reviewStatus: 'PENDING', // Registrada y utilizable; la revisión MSP es posterior.
    },
    include: { species: true, realGarden: { select: { id: true, name: true, province: true } } },
  })

  // Registrar automáticamente la actividad de siembra en la Bitácora Viva con evidencia y recompensas
  try {
    const performedDate = input.plantedOn && /^\d{4}-\d{2}-\d{2}$/.test(input.plantedOn)
      ? input.plantedOn
      : new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const sowingDetails: Record<string, unknown> = {
      speciesName: species.name,
      customName: input.customName,
    }
    if (input.growthStage) {
      sowingDetails['growthStage'] = input.growthStage
    }
    const sowingActivity = await prisma.gardenActivity.create({
      data: {
        gardenId: input.realGardenId,
        actorUserId: input.registeredById,
        type: 'sowing',
        performedDate,
        targetKind: 'plant',
        plantId: createdPlant.id,
        plotIndex: input.plotIndex,
        notes: input.notes || `Siembra documentada de ${species.name}`,
        details: JSON.stringify(sowingDetails),
        reviewStatus: 'PENDING',
      },
    })

    if (input.file) {
      await prisma.activityEvidence.create({
        data: {
          activityId: sowingActivity.id,
          filePath: input.file.path,
          fileUrl: photoUrl,
          mimeType: input.file.mimetype,
          fileSize: input.file.size,
        },
      })
    }

    // Puntos provisionales inmediatos; el MSP confirmará o revertirá el crédito.
    await evaluateActivityReward({
      id: sowingActivity.id,
      actorUserId: input.registeredById,
      type: 'sowing',
      performedDate,
      targetKind: 'plant',
      plantId: createdPlant.id,
      plotIndex: input.plotIndex,
    })
  } catch (actErr) {
    console.error('Error al registrar actividad automática de siembra en Bitácora:', actErr)
  }

  return {
    ...createdPlant,
    growthStage: input.growthStage || undefined,
  }
}

function extractGrowthStage(activities: Array<{ details: string; type: string; reviewStatus: string }>): string | undefined {
  for (const act of activities) {
    // La etapa registrada se refleja de inmediato; una evidencia rechazada no gobierna el espejo.
    if (act.reviewStatus === 'REJECTED') continue
    try {
      const parsed = JSON.parse(act.details || '{}') as { growthStage?: string }
      if (parsed.growthStage && typeof parsed.growthStage === 'string') {
        return parsed.growthStage
      }
    } catch {
      // ignorar JSON malformado
    }
  }
  return undefined
}

export async function listPlantsByGarden(gardenId: string, requestingUserId: string) {
  await assertGardenAccess(gardenId, requestingUserId, { requireApproved: false })
  const plants = await prisma.cultivatedPlant.findMany({
    where: { realGardenId: gardenId },
    select: {
      id: true,
      plotIndex: true,
      speciesId: true,
      customName: true,
      photoUrl: true,
      photoPath: true,
      photoMime: true,
      photoSize: true,
      notes: true,
      plantingDate: true,
      lifecycleStatus: true,
      observedState: true,
      lastHarvestDate: true,
      archivedAt: true,
      reviewStatus: true,          // ← Estado de aprobación MSP de la siembra
      registeredById: true,
      realGardenId: true,
      createdAt: true,
      updatedAt: true,
      species: true,
      activities: {
        where: { voidedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { details: true, type: true, reviewStatus: true },
      },
    },
    orderBy: { plotIndex: 'asc' },
  })

  return plants.map(({ activities, ...plant }) => ({
    ...plant,
    growthStage: extractGrowthStage(activities),
  }))
}

export async function removePlant(plantId: string, requestingUserId: string) {
  const plant = await prisma.cultivatedPlant.findUnique({
    where: { id: plantId },
    select: { id: true, registeredById: true, realGarden: { select: { createdById: true } } },
  })
  if (!plant) throw Object.assign(new Error('Planta no encontrada.'), { code: 'NOT_FOUND' })

  // Solo el registrador o el creador del huerto pueden desarraigar la planta
  const isOwner = plant.registeredById === requestingUserId
  const isGardenOwner = plant.realGarden?.createdById === requestingUserId
  if (!isOwner && !isGardenOwner) {
    throw Object.assign(
      new Error('No tienes permiso para remover esta planta. Solo el registrador o el dueño del huerto pueden desarraigarla.'),
      { code: 'FORBIDDEN' }
    )
  }

  // Eliminar careLogs en cascada (definido en el schema con onDelete: Cascade)
  await prisma.cultivatedPlant.delete({ where: { id: plantId } })
}

export async function archivePlant(plantId: string, requestingUserId: string) {
  const plant = await prisma.cultivatedPlant.findUnique({
    where: { id: plantId },
    select: {
      id: true,
      registeredById: true,
      realGarden: {
        select: {
          createdById: true,
          communityId: true,
          community: { select: { creatorId: true } },
        },
      },
    },
  })
  if (!plant) throw Object.assign(new Error('Planta no encontrada.'), { code: 'NOT_FOUND' })

  // Si el huerto pertenece a una comunidad, SOLO las personas con rol RESPONSABLE pueden archivar plantas
  if (plant.realGarden?.communityId) {
    const member = await prisma.communityMember.findFirst({
      where: {
        communityId: plant.realGarden.communityId,
        userId: requestingUserId,
        status: 'ACCEPTED',
      },
      select: { roleInCommunity: true },
    })

    const isCommunityCreator = plant.realGarden.community?.creatorId === requestingUserId
    const isGardenCreator = plant.realGarden.createdById === requestingUserId
    const isResponsible = member?.roleInCommunity === 'RESPONSABLE' || isCommunityCreator || isGardenCreator

    if (!isResponsible) {
      throw Object.assign(
        new Error('Solo las personas con rol Responsable pueden archivar plantas y liberar parcelas. Los participantes no tienen permisos para archivar.'),
        { code: 'FORBIDDEN' }
      )
    }
  } else {
    // Huerto individual sin comunidad: solo el creador del huerto o registrador puede archivar
    const isOwner = plant.registeredById === requestingUserId
    const isGardenOwner = plant.realGarden?.createdById === requestingUserId
    if (!isOwner && !isGardenOwner) {
      throw Object.assign(
        new Error('Solo el responsable del huerto puede archivar esta planta.'),
        { code: 'FORBIDDEN' }
      )
    }
  }

  // Marcar como archivada: liberar parcela (plotIndex = null) y conservar todos los datos
  return prisma.cultivatedPlant.update({
    where: { id: plantId },
    data: {
      lifecycleStatus: 'ARCHIVED',
      archivedAt: new Date(),
      plotIndex: null,
    },
    include: { species: true, realGarden: { select: { id: true, name: true, province: true } } },
  })
}

export async function getPlantPassport(plantId: string, requestingUserId: string) {
  const owner = await prisma.cultivatedPlant.findUnique({ where: { id: plantId }, select: { realGardenId: true } })
  if (!owner) return null
  await assertGardenAccess(owner.realGardenId, requestingUserId, { requireApproved: false })
  return prisma.cultivatedPlant.findUnique({
    where: { id: plantId },
    include: {
      species: true,
      realGarden: {
        select: {
          id: true, name: true, province: true, canton: true, parish: true,
          latitude: true, longitude: true,
        },
      },
      registeredBy: { select: { id: true, name: true } },
    },
  })
}

export interface UpdatePlantInput {
  plantId: string
  requestingUserId: string
  customName?: string
  plantingDate?: string
  notes?: string
  observedState?: string
  growthStage?: string
  plotIndex?: number
  heightCm?: number
  file?: Express.Multer.File
}

export async function updatePlantDetails(input: UpdatePlantInput) {
  const plant = await prisma.cultivatedPlant.findUnique({
    where: { id: input.plantId },
    include: { realGarden: true, species: true },
  })
  if (!plant) throw Object.assign(new Error('Planta no encontrada.'), { code: 'NOT_FOUND' })
  await assertGardenAccess(plant.realGardenId, input.requestingUserId)
  // La planta ya sembrada puede editarse y documentar fotos nuevas aunque MSP aún revise la siembra.

  // La etapa y el estado observados no pueden evolucionar sin evidencia fotográfica nueva.
  // No se bloquea una edición de nombre o notas que conserve la misma etapa.
  if (!input.file) {
    if (input.observedState && input.observedState !== plant.observedState) {
      throw Object.assign(new Error('Adjunta una fotografía real para cambiar el estado observado.'), { code: 'EVIDENCE_REQUIRED' })
    }
    if (input.growthStage) {
      const tracked = await prisma.gardenActivity.findMany({
        where: { plantId: plant.id, voidedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { details: true, type: true, reviewStatus: true },
      })
      const currentStage = extractGrowthStage(tracked)
      if (input.growthStage !== currentStage) {
        throw Object.assign(new Error('Adjunta una fotografía real para documentar una nueva etapa de crecimiento.'), { code: 'EVIDENCE_REQUIRED' })
      }
    }
  }

  const data: Record<string, any> = {}
  if (input.customName !== undefined && input.customName.trim() !== '') {
    data.customName = input.customName.trim()
  }
  if (input.notes !== undefined) {
    data.notes = input.notes.trim()
  }
  if (input.observedState !== undefined && input.observedState.trim() !== '') {
    data.observedState = input.observedState.trim()
    if (input.observedState === 'harvested') {
      data.lifecycleStatus = 'HARVESTED'
    } else if (['flowering', 'mature'].includes(input.observedState)) {
      data.lifecycleStatus = 'READY_TO_HARVEST'
    } else if (['germinated', 'growing'].includes(input.observedState)) {
      data.lifecycleStatus = 'GROWING'
    }
  }
  if (input.plantingDate) {
    const d = new Date(input.plantingDate)
    if (!isNaN(d.getTime())) {
      data.plantingDate = d
    }
  }
  if (input.plotIndex !== undefined && Number.isInteger(input.plotIndex) && input.plotIndex >= 0 && input.plotIndex <= 5 && input.plotIndex !== plant.plotIndex) {
    const existing = await prisma.cultivatedPlant.findUnique({
      where: { realGardenId_plotIndex: { realGardenId: plant.realGardenId, plotIndex: input.plotIndex } },
    })
    if (existing && existing.id !== plant.id) {
      throw Object.assign(new Error('Esa parcela ya está ocupada por otra planta.'), { code: 'PLOT_OCCUPIED' })
    }
    data.plotIndex = input.plotIndex
  }
  if (input.file) {
    const filename = path.basename(input.file.path)
    data.photoUrl = `/uploads/plants/${filename}`
    data.photoPath = input.file.path
    data.photoMime = input.file.mimetype
    data.photoSize = input.file.size
  }

  const updated = await prisma.cultivatedPlant.update({
    where: { id: input.plantId },
    data,
    include: { species: true, realGarden: { select: { id: true, name: true, province: true } } },
  })

  // Documentar observaciones reales sin otorgar recompensas antes de revisión MSP.
  const hasObservation = Boolean(
    input.file || input.heightCm !== undefined ||
    (input.observedState && input.observedState !== plant.observedState) ||
    (input.notes !== undefined && input.notes.trim() !== plant.notes.trim()) ||
    (input.growthStage && input.file)
  )
  if (hasObservation) try {
    const today = new Date().toISOString().split('T')[0]
    const detailsObj: Record<string, any> = {}
    if (input.observedState) detailsObj.state = input.observedState
    if (input.growthStage) detailsObj.growthStage = input.growthStage
    if (input.heightCm !== undefined) detailsObj.heightCm = input.heightCm

    const activity = await prisma.gardenActivity.create({
      data: {
        gardenId: plant.realGardenId,
        actorUserId: input.requestingUserId,
        type: 'observation',
        performedDate: today,
        targetKind: 'plant',
        plantId: plant.id,
        plotIndex: updated.plotIndex,
        notes: input.notes || `Observación actualizada: ${input.observedState || 'seguimiento'}`,
        details: JSON.stringify(detailsObj),
        reviewStatus: 'PENDING',
      },
    })

    if (input.file) {
      await prisma.activityEvidence.create({
        data: {
          activityId: activity.id,
          filePath: input.file.path,
          fileUrl: updated.photoUrl,
          mimeType: input.file.mimetype,
          fileSize: input.file.size,
        },
      })
    }

    // Recompensas: solo tras la aprobación de esta actividad por el MSP.
  } catch (actErr) {
    console.error('Error al registrar actividad automática de observación:', actErr)
  }

  return {
    ...updated,
    ...(input.growthStage ? { growthStage: input.growthStage } : {}),
  }
}

