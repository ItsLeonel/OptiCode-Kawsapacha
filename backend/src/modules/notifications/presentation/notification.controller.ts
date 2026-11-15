// backend/src/modules/notifications/presentation/notification.controller.ts
import type { Response } from 'express'
import { ok, fail } from '../../../shared/utils/response'
import type { AuthRequest } from '../../../shared/types/index'
import {
  listUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearReadNotifications,
} from '../application/notification.service'

export async function getNotifications(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  try {
    const data = await listUserNotifications(req.user.userId)
    ok(res, data, 'Notificaciones obtenidas correctamente.')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al listar notificaciones.'
    fail(res, 'INTERNAL_ERROR', msg, 500)
  }
}

export async function markRead(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const id = String(req.params['id'] ?? '')
  if (!id) return void fail(res, 'VALIDATION_ERROR', 'ID de notificación requerido.', 400)

  try {
    const updated = await markNotificationAsRead(id, req.user.userId)
    ok(res, updated, 'Notificación marcada como leída.')
  } catch (err: unknown) {
    const e = err as { code?: string; message: string }
    if (e.code === 'NOT_FOUND') {
      fail(res, 'NOT_FOUND', e.message, 404)
    } else {
      fail(res, 'INTERNAL_ERROR', 'Error al marcar notificación.', 500)
    }
  }
}

export async function markAllRead(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  try {
    const result = await markAllNotificationsAsRead(req.user.userId)
    ok(res, result, 'Todas las notificaciones marcadas como leídas.')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al marcar notificaciones.'
    fail(res, 'INTERNAL_ERROR', msg, 500)
  }
}

export async function clearRead(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  try {
    const result = await clearReadNotifications(req.user.userId)
    ok(res, result, 'Historial de notificaciones leídas eliminado.')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al vaciar notificaciones leídas.'
    fail(res, 'INTERNAL_ERROR', msg, 500)
  }
}
