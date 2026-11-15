import type { CatalogStoredSpecies } from '../../domain/catalog-species'

/** Contrato de lectura: los casos de uso no conocen Prisma ni SQLite. */
export interface CatalogRepository<T extends CatalogStoredSpecies> {
  findMany(query?: string): Promise<T[]>
  findById(id: string): Promise<T | null>
}
