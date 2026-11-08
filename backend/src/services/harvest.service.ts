// backend/src/services/harvest.service.ts
import { prisma } from '../config/prisma'

export async function harvestPlant(
  plantId: string,
  quantity: string,
  notes: string,
  userId: string
) {
  const plant = await prisma.cultivatedPlant.findUnique({
    where: { id: plantId },
    include: { species: true },
  })
  if (!plant) throw new Error('Planta no encontrada')

  // 1. Obtener communityId desde el huerto
  const garden = await prisma.realGarden.findUnique({
    where: { id: plant.realGardenId },
    select: { id: true, communityId: true, createdById: true },
  })

  let communityId = garden?.communityId ?? null

  // 2. Si no tiene communityId, buscar membresía activa del usuario cosechador
  if (!communityId) {
    const membership = await prisma.communityMember.findFirst({
      where: { userId, status: 'ACCEPTED' },
      select: { communityId: true },
      orderBy: { joinedAt: 'asc' },
    })
    communityId = membership?.communityId ?? null
  }

  // 3. Si aún no hay communityId, buscar membresía activa del creador del huerto
  if (!communityId && garden?.createdById) {
    const creatorMembership = await prisma.communityMember.findFirst({
      where: { userId: garden.createdById, status: 'ACCEPTED' },
      select: { communityId: true },
      orderBy: { joinedAt: 'asc' },
    })
    communityId = creatorMembership?.communityId ?? null
  }

  // 4. Si aún no hay communityId, buscar comunidad creada por el usuario o por el dueño del huerto
  if (!communityId) {
    const createdCommunity = await prisma.community.findFirst({
      where: {
        OR: [
          { creatorId: userId },
          ...(garden?.createdById ? [{ creatorId: garden.createdById }] : []),
        ],
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    })
    communityId = createdCommunity?.id ?? null
  }

  // 5. Si encontramos comunidad y el huerto no la tenía asignada, vincular el huerto a esa comunidad
  if (communityId && garden && !garden.communityId) {
    await prisma.realGarden.update({
      where: { id: plant.realGardenId },
      data: { communityId },
    })
  }

  // 6. Crear registro de cosecha (HarvestRecord) vinculado a la comunidad
  const harvest = await prisma.harvestRecord.create({
    data: {
      realGardenId: plant.realGardenId,
      communityId,
      speciesName: plant.species.name,
      speciesLatinName: plant.species.latinName,
      quantity,
      notes,
      harvestedById: userId,
    },
  })

  // 7. Reflejar automáticamente en la bodega e inventario comunitario (CommunityResource)
  if (communityId) {
    const resourceName = `Cosecha: ${plant.species.name}`
    const existingResource = await prisma.communityResource.findFirst({
      where: {
        communityId,
        name: resourceName,
        category: 'SUPPLY',
      },
    })

    // Extraer cantidad numérica si existe (ej. "500g", "3 atados", "2")
    const match = quantity.trim().match(/^(\d+(?:\.\d+)?)\s*(.*)$/)
    const parsedQty = match && match[1] ? Math.max(1, Math.round(parseFloat(match[1]))) : 1
    const unitStr = (match && match[2] ? match[2].trim() : '') || 'porción'

    if (existingResource) {
      await prisma.communityResource.update({
        where: { id: existingResource.id },
        data: {
          quantity: { increment: parsedQty },
          unit: unitStr || existingResource.unit,
          description: `Última cosecha: ${quantity}. ${notes}`.trim(),
          status: 'DISPONIBLE',
        },
      })
    } else {
      await prisma.communityResource.create({
        data: {
          communityId,
          name: resourceName,
          category: 'SUPPLY',
          quantity: parsedQty,
          unit: unitStr,
          status: 'DISPONIBLE',
          description: `Cosecha fresca de ${plant.species.name} (${plant.species.latinName}). ${notes}`.trim(),
        },
      })
    }
  }

  // 8. Marcar la planta en estado REGROWING (ciclo de rebrote — NO libera la parcela)
  // Las hierbas medicinales andinas son perennes: la cosecha es poda/recolección,
  // la planta permanece sembrada e inicia un nuevo ciclo vegetativo.
  await prisma.cultivatedPlant.update({
    where: { id: plantId },
    data: {
      lifecycleStatus: 'REGROWING',
      lastHarvestDate: new Date(),
    },
  })

  return harvest
}

export async function listHarvestsByGarden(gardenId: string) {
  return prisma.harvestRecord.findMany({
    where: { realGardenId: gardenId },
    include: {
      harvestedBy: { select: { id: true, name: true } },
    },
    orderBy: { harvestDate: 'desc' },
  })
}

export async function listHarvestsByCommunity(communityId: string) {
  return prisma.harvestRecord.findMany({
    where: {
      OR: [
        { communityId },
        { realGarden: { communityId } },
      ],
    },
    include: {
      harvestedBy: { select: { id: true, name: true } },
      realGarden: { select: { id: true, name: true } },
    },
    orderBy: { harvestDate: 'desc' },
  })
}
