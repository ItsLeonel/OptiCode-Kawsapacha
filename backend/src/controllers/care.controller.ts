// backend/src/controllers/care.controller.ts
import type { Response } from 'express'
import type { AuthRequest } from '../types'
import { ok, fail } from '../utils/response'
import * as careService from '../services/care.service'
import { prisma } from '../config/prisma'
import { assertGardenAccess } from '../services/activity.service'

async function requirePlantAccess(plantId: string, userId: string, approved: boolean): Promise<void> {
  const plant = await prisma.cultivatedPlant.findUnique({ where: { id: plantId }, select: { realGardenId: true, reviewStatus: true } })
  if (!plant) throw Object.assign(new Error('Planta no encontrada.'), { code: 'NOT_FOUND' })
  await assertGardenAccess(plant.realGardenId, userId, { requireApproved: approved })
  if (approved && plant.reviewStatus !== 'APPROVED') {
    throw Object.assign(new Error('Esta planta todavía requiere aprobación MSP para registrar cuidados.'), { code: 'PLANT_NOT_APPROVED' })
  }
}

function careFailure(res: Response, err: unknown, fallback: string): void {
  const e = err as { code?: string; message?: string }
  const status = ['FORBIDDEN', 'COMMUNITY_NOT_APPROVED', 'PLANT_NOT_APPROVED'].includes(e?.code || '') ? 403
    : e?.code === 'NOT_FOUND' ? 404 : 400
  fail(res, e?.code || 'CARE_ERROR', e?.message || fallback, status)
}

export async function addCare(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const plantId = String(req.params['id'] ?? '')
  const { actionType, notes } = req.body as { actionType?: string; notes?: string }

  if (!actionType?.trim()) return void fail(res, 'VALIDATION_ERROR', 'actionType es obligatorio.', 400)

  try {
    await requirePlantAccess(plantId, req.user.userId, true)
    const log = await careService.addCareLog(plantId, actionType.trim(), notes ?? '', req.user.userId)
    ok(res, { log }, 'Cuidado registrado.', 201)
  } catch (err: unknown) {
    careFailure(res, err, 'Error al registrar cuidado.')
  }
}

export async function getCare(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  try {
    const plantId = String(req.params['id'] ?? '')
    await requirePlantAccess(plantId, req.user.userId, false)
    const logs = await careService.getCareLogs(plantId)
    ok(res, { logs }, 'Bitácora de cuidados.')
  } catch (err: unknown) {
    careFailure(res, err, 'Error al obtener cuidados.')
  }
}

export async function getGrowth(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  try {
    const plantId = String(req.params['id'] ?? '')
    await requirePlantAccess(plantId, req.user.userId, false)
    const growth = await careService.calculateGrowth(plantId)
    ok(res, { growth }, 'Datos de crecimiento.')
  } catch (err: unknown) {
    careFailure(res, err, 'Error al calcular crecimiento.')
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
