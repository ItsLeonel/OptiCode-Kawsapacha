// backend/src/controllers/care.controller.ts
import type { Response } from 'express'
import type { AuthRequest } from '../types'
import { ok, fail } from '../utils/response'
import * as careService from '../services/care.service'

export async function addCare(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const plantId = String(req.params['id'] ?? '')
  const { actionType, notes } = req.body as { actionType?: string; notes?: string }

  if (!actionType?.trim()) return void fail(res, 'VALIDATION_ERROR', 'actionType es obligatorio.', 400)

  try {
    const log = await careService.addCareLog(plantId, actionType.trim(), notes ?? '', req.user.userId)
    ok(res, { log }, 'Cuidado registrado.', 201)
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al registrar cuidado.', 500)
  }
}

export async function getCare(req: AuthRequest, res: Response): Promise<void> {
  try {
    const plantId = String(req.params['id'] ?? '')
    const logs = await careService.getCareLogs(plantId)
    ok(res, { logs }, 'Bitácora de cuidados.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al obtener cuidados.', 500)
  }
}

export async function getGrowth(req: AuthRequest, res: Response): Promise<void> {
  try {
    const plantId = String(req.params['id'] ?? '')
    const growth = await careService.calculateGrowth(plantId)
    ok(res, { growth }, 'Datos de crecimiento.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al calcular crecimiento.', 500)
  }
}

export async function getCalendarTips(req: AuthRequest, res: Response): Promise<void> {
  try {
    const speciesId = String(req.params['id'] ?? '')
    const calendar = await careService.getCalendarTips(speciesId)
    ok(res, { calendar }, 'Consejos del calendario agrícola.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al obtener calendario.', 500)
  }
}
