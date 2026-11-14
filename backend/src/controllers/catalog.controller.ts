import type { Request, Response } from 'express'
import { CATALOG_REGIONS, listCatalog, getCatalogById, type CatalogRegion } from '../services/catalog.service'
import { ok, fail } from '../utils/response'

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const region = typeof req.query['region'] === 'string' ? req.query['region'] : undefined
    if (region && !CATALOG_REGIONS.includes(region as CatalogRegion)) {
      return void fail(res, 'VALIDATION_ERROR', 'Región inválida.', 400)
    }
    const q = typeof req.query['q'] === 'string' ? req.query['q'].trim().slice(0, 100) : undefined
    const species = await listCatalog(q || undefined, region as CatalogRegion | undefined)
    ok(res, { species }, 'Catálogo medicinal por región.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al obtener el catálogo.', 500)
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const species = await getCatalogById(String(req.params['id'] ?? ''))
    if (!species) return void fail(res, 'NOT_FOUND', 'Especie no encontrada en el catálogo.', 404)
    ok(res, { species }, 'Ficha botánica.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al obtener la especie.', 500)
  }
}
