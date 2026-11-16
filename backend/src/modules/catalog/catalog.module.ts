/** Raíz de composición: única unión de los casos de uso y el adaptador concreto. */
import { createCatalogService } from './application/catalog.service'
import { prismaCatalogRepository } from './infrastructure/prisma-catalog.repository'

export const { listCatalog, getCatalogById } = createCatalogService(prismaCatalogRepository)
