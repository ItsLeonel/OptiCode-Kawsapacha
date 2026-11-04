import type { Response } from 'express'
import { registerPlant, listPlantsByGarden, getPlantPassport } from '../services/plant.service'
import { ok, fail } from '../utils/response'
import type { AuthRequest } from '../types'

export async function register(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  if (!req.file) return void fail(res, 'MISSING_PHOTO', 'Se requiere una fotografía de la planta.', 400)

  const gardenId = String(req.params['gardenId'] ?? '')
  const b = req.body as Record<string, string>
  const plotIndex = parseInt(b['plotIndex'] ?? '-1', 10)

  if (!b['speciesId']) return void fail(res, 'VALIDATION_ERROR', 'Selecciona una especie del catálogo.', 400)
  if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex > 5)
    return void fail(res, 'VALIDATION_ERROR', 'La parcela debe ser un número del 0 al 5.', 400)

  try {
    const plant = await registerPlant({
      realGardenId: gardenId,
      speciesId: b['speciesId'],
      plotIndex,
      customName: (b['customName'] ?? '').trim(),
      notes: (b['notes'] ?? '').trim(),
      registeredById: req.user.userId,
      file: req.file,
    })
    ok(res, { plant }, 'Planta registrada en el huerto virtual.', 201)
  } catch (err: unknown) {
    const e = err as { code?: string; message: string }
    if (e.code === 'PLOT_OCCUPIED') return void fail(res, 'PLOT_OCCUPIED', e.message, 409)
    if (e.code === 'INVALID_PLOT') return void fail(res, 'INVALID_PLOT', e.message, 400)
    if (e.code === 'GARDEN_NOT_FOUND') return void fail(res, 'GARDEN_NOT_FOUND', e.message, 404)
    if (e.code === 'SPECIES_NOT_FOUND') return void fail(res, 'SPECIES_NOT_FOUND', e.message, 404)
    fail(res, 'INTERNAL_ERROR', 'Error al registrar la planta.', 500)
  }
}

export async function listByGarden(req: AuthRequest, res: Response): Promise<void> {
  try {
    const plants = await listPlantsByGarden(String(req.params['gardenId'] ?? ''))
    ok(res, { plants }, 'Plantas del huerto virtual.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al obtener las plantas.', 500)
  }
}

export async function passport(req: AuthRequest, res: Response): Promise<void> {
  try {
    const plant = await getPlantPassport(String(req.params['id'] ?? ''))
    if (!plant) return void fail(res, 'NOT_FOUND', 'Planta no encontrada.', 404)
    ok(res, { passport: plant }, 'Pasaporte Vivo de la planta.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al obtener el Pasaporte Vivo.', 500)
  }
}

