import { CATALOG_REGIONS, serializeSpecies, type CatalogRegion } from '../domain/catalog-species'
import type { CatalogRepository } from './catalog.repository'

export { CATALOG_REGIONS } from '../domain/catalog-species'
export type { CatalogRegion } from '../domain/catalog-species'

export async function listCatalog(query: string | undefined, region: CatalogRegion | undefined, repository: CatalogRepository) {
  const plants = await repository.findAll(query)
  return plants.map(serializeSpecies).filter(plant => !region || plant.regions.includes(region))
}

export async function getCatalogById(id: string, repository: CatalogRepository) {
  const plant = await repository.findById(id)
  return plant ? serializeSpecies(plant) : null
}
