import { prisma } from '../config/prisma'
import path from 'path'
import { evaluateActivityReward } from './rewards.service'

const MAX_PLOTS = 6

export interface RegisterPlantInput {
  realGardenId: string
  speciesId: string
  plotIndex: number
  customName: string
  notes: string
  registeredById: string
  file: Express.Multer.File
}

export async function registerPlant(input: RegisterPlantInput) {
  // Validar rango de parcela
  if (input.plotIndex < 0 || input.plotIndex >= MAX_PLOTS) {
    throw Object.assign(new Error(`La parcela debe estar entre 0 y ${MAX_PLOTS - 1}.`), { code: 'INVALID_PLOT' })
  }

  // Verificar que la parcela esté libre (si estaba cosechada, liberar la parcela automáticamente)
  const existing = await prisma.cultivatedPlant.findUnique({
    where: { realGardenId_plotIndex: { realGardenId: input.realGardenId, plotIndex: input.plotIndex } },
  })
  if (existing) {
    if (existing.lifecycleStatus === 'HARVESTED') {
      await prisma.careLog.deleteMany({ where: { plantId: existing.id } })
      await prisma.cultivatedPlant.delete({ where: { id: existing.id } })
    } else {
      throw Object.assign(new Error('Esa parcela ya está ocupada. Elige otra.'), { code: 'PLOT_OCCUPIED' })
    }
  }

  // Verificar que el huerto existe
  const garden = await prisma.realGarden.findUnique({ where: { id: input.realGardenId } })
  if (!garden) throw Object.assign(new Error('El huerto no existe.'), { code: 'GARDEN_NOT_FOUND' })

  // Verificar que la especie existe
  const species = await prisma.medicinalCatalog.findUnique({ where: { id: input.speciesId } })
  if (!species) throw Object.assign(new Error('La especie no está en el catálogo.'), { code: 'SPECIES_NOT_FOUND' })

  // Construir URL pública de la foto
  const filename = path.basename(input.file.path)
  const photoUrl = `/uploads/plants/${filename}`

  return prisma.cultivatedPlant.create({
    data: {
      realGardenId: input.realGardenId,
      speciesId: input.speciesId,
      plotIndex: input.plotIndex,
      customName: input.customName,
      notes: input.notes,
      registeredById: input.registeredById,
      photoUrl,
      photoPath: input.file.path,
      photoMime: input.file.mimetype,
      photoSize: input.file.size,
    },
    include: { species: true, realGarden: { select: { id: true, name: true, province: true } } },
  })
}

export async function listPlantsByGarden(gardenId: string) {
  return prisma.cultivatedPlant.findMany({
    where: { realGardenId: gardenId },
    include: { species: true },
    orderBy: { plotIndex: 'asc' },
  })
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

export async function getPlantPassport(plantId: string) {
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

  // Registrar actividad de tipo observation en la Bitácora Viva
  try {
    const today = new Date().toISOString().split('T')[0]
    const detailsObj: Record<string, any> = {}
    if (input.observedState) detailsObj.state = input.observedState
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

    await evaluateActivityReward(activity)
  } catch (actErr) {
    console.error('Error al registrar actividad automática de observación:', actErr)
  }

  return updated
}

