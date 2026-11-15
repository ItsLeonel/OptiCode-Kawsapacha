import type { CatalogRecord } from '../domain/catalog-species'

/** Puerto de lectura: el dominio y la aplicación no conocen Prisma. */
export interface CatalogRepository {
  findAll(query?: string): Promise<CatalogRecord[]>
  findById(id: string): Promise<CatalogRecord | null>
}
