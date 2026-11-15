/**
 * Contrato mínimo del catálogo: los adaptadores pueden proporcionar propiedades
 * adicionales, que se conservan al serializar las fichas para la API.
 */
export interface CatalogRecord {
  id: string
  name: string
  latinName: string
  family: string
  regions: string
  otherNames: string
  usageTags: string
}

export const CATALOG_REGIONS = ['costa', 'sierra', 'oriente', 'galapagos'] as const
export type CatalogRegion = typeof CATALOG_REGIONS[number]

export function decodeCatalogArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch { return [] }
}

export function serializeSpecies<T extends CatalogRecord>(plant: T) {
  return {
    ...plant,
    regions: decodeCatalogArray(plant.regions),
    otherNames: decodeCatalogArray(plant.otherNames),
    usageTags: decodeCatalogArray(plant.usageTags),
  }
}
