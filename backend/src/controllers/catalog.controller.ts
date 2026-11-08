import type { Request, Response } from 'express'
import { listCatalog, getCatalogById } from '../services/catalog.service'
import { ok, fail } from '../utils/response'

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const q = req.query['q']
    const query = q ? String(q) : undefined
    const species = await listCatalog(query)
    ok(res, { species }, 'Catálogo medicinal.')
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
