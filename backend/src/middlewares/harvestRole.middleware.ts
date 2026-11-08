// backend/src/middlewares/harvestRole.middleware.ts
// Verifica que el usuario tiene rol RESPONSABLE o CUIDADOR en la comunidad del huerto
// antes de permitir la cosecha de una planta.

import type { Response, NextFunction } from 'express'
import { fail } from '../utils/response'
import { prisma } from '../config/prisma'
import type { AuthRequest } from '../types'

/**
 * Middleware para POST /api/plants/:id/harvest
 * Verifica que el usuario sea RESPONSABLE o CUIDADOR de la comunidad
 * vinculada al huerto de la planta. Si no hay comunidad vinculada
 * (huerto personal), solo el creador del huerto puede cosechar.
 */
export async function requireHarvestRole(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
    return
  }

  const plantId = String(req.params['id'] ?? '')
  if (!plantId) {
    fail(res, 'VALIDATION_ERROR', 'plantId es requerido.', 400)
    return
  }

  try {
    // Buscar la planta y su huerto
    const plant = await prisma.cultivatedPlant.findUnique({
      where: { id: plantId },
      select: { realGardenId: true },
    })

    if (!plant) {
      fail(res, 'NOT_FOUND', 'Planta no encontrada.', 404)
      return
    }

    const garden = await prisma.realGarden.findUnique({
      where: { id: plant.realGardenId },
      select: { communityId: true, createdById: true },
    })

    if (!garden) {
      fail(res, 'NOT_FOUND', 'Huerto no encontrado.', 404)
      return
    }

    const userId = req.user.userId

    // Si el huerto tiene comunidad: verificar RESPONSABLE o CUIDADOR
    if (garden.communityId) {
      const member = await prisma.communityMember.findFirst({
        where: {
          communityId: garden.communityId,
          userId,
          status: 'ACCEPTED',
        },
        select: { roleInCommunity: true },
      })

      if (!member) {
        fail(res, 'FORBIDDEN', 'No eres miembro activo de la comunidad de este huerto.', 403)
        return
      }

      const role = member.roleInCommunity
      if (role !== 'RESPONSABLE' && role !== 'CUIDADOR') {
        fail(
          res,
          'FORBIDDEN',
          'La cosecha de plantas está reservada para Cuidadores y Responsables del huerto.',
          403
        )
        return
      }
    } else {
      // Huerto sin comunidad: solo el creador puede cosechar
      if (garden.createdById !== userId) {
        fail(res, 'FORBIDDEN', 'Solo el creador del huerto puede cosechar sus plantas.', 403)
        return
      }
    }

    next()
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al verificar permisos de cosecha.', 500)
  }
}

