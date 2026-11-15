// Verificación de permisos de cosecha; las consultas de persistencia se inyectan en el caso de uso.
import type { Response, NextFunction } from 'express'
import { fail } from '../utils/response'
import { checkHarvestPermission } from '../../modules/harvest/harvest.module'
import type { AuthRequest } from '../types/index'

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
    const result = await checkHarvestPermission(plantId, req.user.userId)
    if (result === 'PLANT_NOT_FOUND') {
      fail(res, 'NOT_FOUND', 'Planta no encontrada.', 404)
      return
    }
    if (result === 'GARDEN_NOT_FOUND') {
      fail(res, 'NOT_FOUND', 'Huerto no encontrado.', 404)
      return
    }
    if (result === 'NOT_MEMBER') {
      fail(res, 'FORBIDDEN', 'No eres miembro activo de la comunidad de este huerto.', 403)
      return
    }
    if (result === 'INSUFFICIENT_ROLE') {
      fail(res, 'FORBIDDEN', 'La cosecha de plantas está reservada para Cuidadores y Responsables del huerto.', 403)
      return
    }
    if (result === 'NOT_CREATOR') {
      fail(res, 'FORBIDDEN', 'Solo el creador del huerto puede cosechar sus plantas.', 403)
      return
    }
    next()
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al verificar permisos de cosecha.', 500)
  }
}
