// backend/src/modules/administration/presentation/admin-technical.controller.ts
import type { Response } from 'express'
import { ok, fail } from '../../../shared/utils/response'
import type { AuthRequest } from '../../../types'
import {
  provisionMspUser,
  toggleUserStatus,
  listAdministrativeUsers,
} from '../application/admin-technical.service'
import { listAuditLogs } from '../application/audit.service'

export async function createMspAccount(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string }

  if (!name || name.trim().length < 2) {
    return void fail(res, 'VALIDATION_ERROR', 'El nombre debe tener al menos 2 caracteres.', 400)
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return void fail(res, 'VALIDATION_ERROR', 'Escribe un correo electrónico válido.', 400)
  }
  if (!password || password.length < 8) {
    return void fail(res, 'VALIDATION_ERROR', 'La contraseña debe tener al menos 8 caracteres.', 400)
  }

  try {
    const user = await provisionMspUser({ name, email, password }, req.user.userId)
    ok(res, user, 'Cuenta de funcionario ADMIN_MSP aprovisionada exitosamente.', 201)
  } catch (err: unknown) {
    const e = err as { code?: string; message: string }
    if (e.code === 'EMAIL_IN_USE') {
      fail(res, 'EMAIL_IN_USE', e.message, 409)
    } else {
      fail(res, 'INTERNAL_ERROR', e.message || 'Error al aprovisionar cuenta MSP.', 500)
    }
  }
}

export async function updateUserActiveStatus(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const id = String(req.params['id'] ?? '')
  const { isActive, reason } = req.body as { isActive?: boolean; reason?: string }

  if (!id) return void fail(res, 'VALIDATION_ERROR', 'ID de usuario requerido.', 400)
  if (typeof isActive !== 'boolean') {
    return void fail(res, 'VALIDATION_ERROR', 'El campo isActive debe ser booleano (true o false).', 400)
  }

  try {
    const updated = await toggleUserStatus(id, isActive, req.user.userId, reason)
    ok(res, updated, `Estado del usuario actualizado a ${isActive ? 'Activo' : 'Inactivo'}.`)
  } catch (err: unknown) {
    const e = err as { code?: string; message: string }
    if (e.code === 'PROTECTED_LAST_ADMIN') {
      fail(res, 'FORBIDDEN', e.message, 403)
    } else if (e.code === 'NOT_FOUND') {
      fail(res, 'NOT_FOUND', e.message, 404)
    } else {
      fail(res, 'INTERNAL_ERROR', e.message || 'Error al cambiar estado del usuario.', 500)
    }
  }
}

export async function getAdminUsers(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const users = await listAdministrativeUsers()
    ok(res, users, 'Listado de cuentas del sistema.')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al listar usuarios administrativos.'
    fail(res, 'INTERNAL_ERROR', msg, 500)
  }
}

export async function getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
  const page = parseInt(String(req.query['page'] ?? '1'), 10)
  const limit = parseInt(String(req.query['limit'] ?? '20'), 10)
  const actorId = req.query['actorId'] ? String(req.query['actorId']) : undefined
  const targetResource = req.query['targetResource'] ? String(req.query['targetResource']) : undefined
  const action = req.query['action'] ? String(req.query['action']) : undefined

  try {
    const result = await listAuditLogs({ page, limit, actorId, targetResource, action })
    ok(res, result, 'Registros de auditoría obtenidos correctamente.')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al consultar logs de auditoría.'
    fail(res, 'INTERNAL_ERROR', msg, 500)
  }
}
