// backend/src/controllers/harvest.controller.ts
import type { Response } from 'express'
import type { AuthRequest } from '../types'
import { ok, fail } from '../utils/response'
import * as harvestService from '../services/harvest.service'

export async function harvestPlant(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const plantId = String(req.params['id'] ?? '')
  const { quantity, notes } = req.body as { quantity?: string; notes?: string }

  if (!quantity?.trim()) return void fail(res, 'VALIDATION_ERROR', 'quantity es obligatorio.', 400)

  try {
    const harvest = await harvestService.harvestPlant(plantId, quantity.trim(), notes ?? '', req.user.userId)
    ok(res, { harvest }, 'Cosecha registrada.', 201)
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al registrar cosecha.', 500)
  }
}

export async function listByGarden(req: AuthRequest, res: Response): Promise<void> {
  try {
    const gardenId = String(req.params['id'] ?? '')
    const harvests = await harvestService.listHarvestsByGarden(gardenId)
    ok(res, { harvests }, 'Cosechas del huerto.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al listar cosechas.', 500)
  }
}

export async function listByCommunity(req: AuthRequest, res: Response): Promise<void> {
  try {
    const communityId = String(req.params['id'] ?? '')
    const harvests = await harvestService.listHarvestsByCommunity(communityId)
    ok(res, { harvests }, 'Cosechas de la comunidad.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al listar cosechas.', 500)
  }
}
