// backend/src/modules/harvest/presentation/harvest.controller.ts
import type { Response } from 'express'
import type { AuthRequest } from '../../../types'
import { ok, fail } from '../../../shared/utils/response'
import * as harvestService from '../application/harvest.service'
import { prisma } from '../../../infrastructure/database/prisma'
import { assertGardenAccess } from '../../activities/application/activity.service'

export async function harvestPlant(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const plantId = String(req.params['id'] ?? '')
  const { quantity, notes } = req.body as { quantity?: string; notes?: string }

  if (!quantity?.trim()) return void fail(res, 'VALIDATION_ERROR', 'quantity es obligatorio.', 400)

  try {
    const plant = await prisma.cultivatedPlant.findUnique({ where: { id: plantId }, select: { realGardenId: true } })
    if (!plant) return void fail(res, 'NOT_FOUND', 'Planta no encontrada.', 404)
    await assertGardenAccess(plant.realGardenId, req.user.userId)
    const harvest = await harvestService.harvestPlant(plantId, quantity.trim(), notes ?? '', req.user.userId)
    ok(res, { harvest }, 'Cosecha registrada.', 201)
  } catch (err: any) {
    const code = err?.code
    const status = code === 'ACTIVITY_ALREADY_PENDING' ? 409 : ['FORBIDDEN', 'PLANT_NOT_APPROVED', 'COMMUNITY_NOT_APPROVED'].includes(code) ? 403 : 500
    fail(res, code || 'INTERNAL_ERROR', err?.message || 'Error al registrar cosecha.', status)
  }
}

export async function listByGarden(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  try {
    const gardenId = String(req.params['id'] ?? '')
    await assertGardenAccess(gardenId, req.user.userId, { requireApproved: false })
    const harvests = await harvestService.listHarvestsByGarden(gardenId)
    ok(res, { harvests }, 'Cosechas del huerto.')
  } catch (err: any) {
    const status = err?.code === 'FORBIDDEN' ? 403 : 500
    fail(res, err?.code || 'INTERNAL_ERROR', err?.message || 'Error al listar cosechas.', status)
  }
}

export async function listByCommunity(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  try {
    const communityId = String(req.params['id'] ?? '')
    const community = await prisma.community.findUnique({ where: { id: communityId }, select: { creatorId: true } })
    if (!community) return void fail(res, 'NOT_FOUND', 'Comunidad no encontrada.', 404)
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: req.user.userId } },
      select: { status: true },
    })
    if (community.creatorId !== req.user.userId && member?.status !== 'ACCEPTED') {
      return void fail(res, 'FORBIDDEN', 'No tienes acceso a las cosechas de esta comunidad.', 403)
    }
    const harvests = await harvestService.listHarvestsByCommunity(communityId)
    ok(res, { harvests }, 'Cosechas de la comunidad.')
  } catch (err: any) {
    fail(res, 'INTERNAL_ERROR', err?.message || 'Error al listar cosechas.', 500)
  }
}
