// backend/src/modules/administration/presentation/admin-msp.controller.ts
import type { Response } from 'express'
import { ok, fail } from '../../../shared/utils/response'
import type { AuthRequest } from '../../../shared/types/index'
import {
  listCommunitiesForMsp,
  reviewCommunity,
  listActivitiesForMsp,
  reviewActivity,
  listInstitutionalEvents,
  createInstitutionalEvent,
  deleteInstitutionalEvent,
  listEducationalResources,
  createEducationalResource,
  deleteEducationalResource,
} from '../admin-msp.module'

export async function getCommunitiesMsp(req: AuthRequest, res: Response): Promise<void> {
  const page = parseInt(String(req.query['page'] ?? '1'), 10)
  const limit = parseInt(String(req.query['limit'] ?? '20'), 10)
  const province = req.query['province'] ? String(req.query['province']) : undefined
  const status = req.query['status'] ? String(req.query['status']) : undefined
  const search = req.query['search'] ? String(req.query['search']) : undefined

  try {
    const result = await listCommunitiesForMsp({ page, limit, province, status, search })
    ok(res, result, 'Comunidades listadas para supervisión MSP.')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al listar comunidades para MSP.'
    fail(res, 'INTERNAL_ERROR', msg, 500)
  }
}

export async function postReviewCommunity(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const id = String(req.params['id'] ?? '')
  const { action, reason } = req.body as {
    action?: 'APPROVED' | 'NEEDS_CHANGES' | 'REJECTED' | 'SUSPENDED'
    reason?: string
  }

  if (!id) return void fail(res, 'VALIDATION_ERROR', 'ID de comunidad requerido.', 400)
  if (!action || !['APPROVED', 'NEEDS_CHANGES', 'REJECTED', 'SUSPENDED'].includes(action)) {
    return void fail(res, 'VALIDATION_ERROR', 'Acción inválida. Opciones: APPROVED, NEEDS_CHANGES, REJECTED, SUSPENDED.', 400)
  }

  try {
    const result = await reviewCommunity(id, action, req.user.userId, reason)
    ok(res, result, `Comunidad ${action === 'APPROVED' ? 'aprobada' : 'evaluada'} exitosamente.`)
  } catch (err: unknown) {
    const e = err as { code?: string; message: string }
    if (e.code === 'VALIDATION_ERROR') {
      fail(res, 'VALIDATION_ERROR', e.message, 400)
    } else if (e.code === 'NOT_FOUND') {
      fail(res, 'NOT_FOUND', e.message, 404)
    } else {
      fail(res, 'INTERNAL_ERROR', e.message || 'Error al revisar comunidad.', 500)
    }
  }
}

export async function getActivitiesMsp(req: AuthRequest, res: Response): Promise<void> {
  const page = parseInt(String(req.query['page'] ?? '1'), 10)
  const limit = parseInt(String(req.query['limit'] ?? '20'), 10)
  const status = req.query['status'] ? String(req.query['status']) : undefined
  const gardenId = req.query['gardenId'] ? String(req.query['gardenId']) : undefined
  const type = req.query['type'] ? String(req.query['type']) : undefined

  try {
    const result = await listActivitiesForMsp({ page, limit, status, gardenId, type })
    ok(res, result, 'Bandeja de actividades para supervisión MSP.')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al listar actividades para MSP.'
    fail(res, 'INTERNAL_ERROR', msg, 500)
  }
}

export async function postReviewActivity(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const id = String(req.params['id'] ?? '')
  const { action, reason } = req.body as {
    action?: 'APPROVED' | 'NEEDS_CHANGES' | 'REJECTED'
    reason?: string
  }

  if (!id) return void fail(res, 'VALIDATION_ERROR', 'ID de actividad requerido.', 400)
  if (!action || !['APPROVED', 'NEEDS_CHANGES', 'REJECTED'].includes(action)) {
    return void fail(res, 'VALIDATION_ERROR', 'Acción inválida. Opciones: APPROVED, NEEDS_CHANGES, REJECTED.', 400)
  }

  try {
    const result = await reviewActivity(id, action, req.user.userId, reason)
    ok(res, result, `Actividad ${action === 'APPROVED' ? 'verificada sin duplicar puntos' : 'evaluada con ajuste de puntos'} exitosamente.`)
  } catch (err: unknown) {
    const e = err as { code?: string; message: string }
    if (e.code === 'VALIDATION_ERROR') {
      fail(res, 'VALIDATION_ERROR', e.message, 400)
    } else if (e.code === 'NOT_FOUND') {
      fail(res, 'NOT_FOUND', e.message, 404)
    } else if (e.code === 'ACTIVITY_VOIDED' || e.code === 'REVIEW_FINALIZED' || e.code === 'COMMUNITY_NOT_APPROVED') {
      fail(res, 'CONFLICT', e.message, 409)
    } else {
      fail(res, 'INTERNAL_ERROR', e.message || 'Error al revisar actividad.', 500)
    }
  }
}

// ─── EVENTOS INSTITUCIONALES (MSP) ────────────────────────────────────────────

export async function getEventsMsp(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const events = await listInstitutionalEvents()
    ok(res, { events }, 'Eventos institucionales del MSP obtenidos correctamente.')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al listar eventos.'
    fail(res, 'INTERNAL_ERROR', msg, 500)
  }
}

export async function postEventMsp(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  try {
    const event = await createInstitutionalEvent({
      ...req.body,
      createdById: req.user.userId,
    })
    ok(res, { event }, 'Evento institucional publicado exitosamente.')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al crear evento.'
    fail(res, 'INTERNAL_ERROR', msg, 400)
  }
}

export async function deleteEventMsp(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const id = String(req.params['id'] ?? '')
  try {
    await deleteInstitutionalEvent(id)
    ok(res, { deleted: true }, 'Evento eliminado exitosamente.')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar evento.'
    fail(res, 'INTERNAL_ERROR', msg, 500)
  }
}

// ─── RECURSOS EDUCATIVOS (MSP) ────────────────────────────────────────────────

export async function getResourcesMsp(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const resources = await listEducationalResources()
    ok(res, { resources }, 'Recursos educativos del MSP obtenidos correctamente.')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al listar recursos.'
    fail(res, 'INTERNAL_ERROR', msg, 500)
  }
}

export async function postResourceMsp(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  try {
    const resource = await createEducationalResource({
      ...req.body,
      createdById: req.user.userId,
    })
    ok(res, { resource }, 'Recurso educativo publicado exitosamente.')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al crear recurso.'
    fail(res, 'INTERNAL_ERROR', msg, 400)
  }
}

export async function deleteResourceMsp(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const id = String(req.params['id'] ?? '')
  try {
    await deleteEducationalResource(id)
    ok(res, { deleted: true }, 'Recurso educativo eliminado exitosamente.')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar recurso.'
    fail(res, 'INTERNAL_ERROR', msg, 500)
  }
}
