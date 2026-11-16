import { CATALOG_REGIONS, serializeCatalogSpecies, type CatalogRegion, type CatalogStoredSpecies } from '../domain/catalog-species'
import type { CatalogRepository } from './ports/catalog.repository'

export { CATALOG_REGIONS } from '../domain/catalog-species'
export type { CatalogRegion } from '../domain/catalog-species'

/** Casos de uso del catálogo; repositorio inyectable para pruebas aisladas. */
export function createCatalogService<T extends CatalogStoredSpecies>(repository: CatalogRepository<T>) {
  return {
    async listCatalog(query?: string, region?: CatalogRegion) {
      const plants = await repository.findMany(query)
      return plants
        .map(serializeCatalogSpecies)
        .filter(plant => !region || plant.regions.includes(region))
    },
    async getCatalogById(id: string) {
      const plant = await repository.findById(id)
      return plant ? serializeCatalogSpecies(plant) : null
    },
  }
}
