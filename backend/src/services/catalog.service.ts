import { prisma } from '../config/prisma'

export const CATALOG_REGIONS = ['costa', 'sierra', 'oriente', 'galapagos'] as const
export type CatalogRegion = typeof CATALOG_REGIONS[number]

function decodeArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch { return [] }
}

function serializeSpecies<T extends { regions: string; otherNames: string; usageTags: string }>(plant: T) {
  return {
    ...plant,
    regions: decodeArray(plant.regions),
    otherNames: decodeArray(plant.otherNames),
    usageTags: decodeArray(plant.usageTags),
  }
}

export async function listCatalog(query?: string, region?: CatalogRegion) {
  const plants = await prisma.medicinalCatalog.findMany({
    where: query
      ? { OR: [
          { name: { contains: query } },
          { latinName: { contains: query } },
          { family: { contains: query } },
          { otherNames: { contains: query } },
        ] }
      : undefined,
    orderBy: { name: 'asc' },
  })
  return plants
    .map(serializeSpecies)
    .filter(plant => !region || plant.regions.includes(region))
}

export async function getCatalogById(id: string) {
  const plant = await prisma.medicinalCatalog.findUnique({ where: { id } })
  return plant ? serializeSpecies(plant) : null
}
