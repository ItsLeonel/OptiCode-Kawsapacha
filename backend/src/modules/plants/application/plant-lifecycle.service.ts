import { prisma } from '../../../infrastructure/database/prisma'

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
