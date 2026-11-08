import { prisma } from '../config/prisma'
import path from 'path'

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

