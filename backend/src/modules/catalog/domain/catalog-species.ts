/** Reglas de normalización de especies sin acceso a HTTP ni persistencia. */
export const CATALOG_REGIONS = ['costa', 'sierra', 'oriente', 'galapagos'] as const
export type CatalogRegion = typeof CATALOG_REGIONS[number]

export interface CatalogStoredSpecies {
  regions: string
  otherNames: string
  usageTags: string
}

export function decodeCatalogArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function serializeCatalogSpecies<T extends CatalogStoredSpecies>(plant: T) {
  return {
    ...plant,
    regions: decodeCatalogArray(plant.regions),
    otherNames: decodeCatalogArray(plant.otherNames),
    usageTags: decodeCatalogArray(plant.usageTags),
  }
}
