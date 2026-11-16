// backend/src/modules/activities/presentation/activity.controller.ts
import type { Response } from 'express'
import type { AuthRequest } from '../../../shared/types/index'
import { ok, fail } from '../../../shared/utils/response'
import {
  createGardenActivity,
  listGardenActivities,
  getGardenActivityDetail,
  voidGardenActivity,
  type ActivityType,
} from '../activity.module'

export async function createActivity(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId
  if (!userId) {
    fail(res, 'UNAUTHORIZED', 'Usuario no autenticado.', 401)
    return
  }

  const gardenId = req.params.gardenId as string
  if (!gardenId) {
    fail(res, 'MISSING_GARDEN_ID', 'Se requiere el parámetro gardenId.', 400)
    return
  }

  try {
    let details: Record<string, unknown> = {}
    if (typeof req.body.details === 'string') {
      try {
        details = JSON.parse(req.body.details)
      } catch {
        details = {}
      }
    } else if (typeof req.body.details === 'object' && req.body.details !== null) {
      details = req.body.details
    }

    const plotIndex = req.body.plotIndex !== undefined && req.body.plotIndex !== ''
      ? Number(req.body.plotIndex)
      : null

    const evidenceFile = req.file
      ? {
          filename: req.file.filename,
          path: req.file.path,
          mimetype: req.file.mimetype,
          size: req.file.size,
        }
      : null

    const result = await createGardenActivity({
      gardenId,
      actorUserId: userId,
      type: req.body.type as ActivityType,
      performedDate: req.body.performedDate || new Date().toISOString().slice(0, 10),
      targetKind: req.body.targetKind || 'garden',
      plantId: req.body.plantId || null,
      plotIndex,
      notes: req.body.notes || '',
      details,
      clientActivityId: req.body.clientActivityId || null,
      evidenceFile,
    })

    const status = result.isDuplicate ? 200 : 201
    const message = result.isDuplicate
      ? 'Actividad ya registrada previamente (idempotencia).'
      : 'Actividad registrada exitosamente en la Bitácora Viva.'

    ok(res, result, message, status)
  } catch (err: unknown) {
    const errCode = (err as { code?: string })?.code
    const status = errCode === 'ACTIVITY_ID_CONFLICT' ? 409 : ['COMMUNITY_NOT_APPROVED', 'PLANT_NOT_APPROVED', 'FORBIDDEN'].includes(errCode || '') ? 403 : 400
    const message = err instanceof Error ? err.message : 'Error al registrar la actividad.'
    fail(res, errCode || 'ACTIVITY_CREATE_ERROR', message, status)
  }
}

export async function getActivities(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId
  if (!userId) {
    fail(res, 'UNAUTHORIZED', 'Usuario no autenticado.', 401)
    return
  }

  const gardenId = req.params.gardenId as string
  const { plantId, type, from, to, includeVoided } = req.query as {
    plantId?: string
    type?: string
    from?: string
    to?: string
    includeVoided?: string
  }

  try {
    const activities = await listGardenActivities(gardenId, userId, {
      plantId,
      type,
      from,
      to,
      includeVoided: includeVoided === 'true',
    })

    ok(res, activities, `Se recuperaron ${activities.length} actividades de la Bitácora Viva.`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al listar actividades.'
    fail(res, 'ACTIVITY_LIST_ERROR', message, 400)
  }
}

export async function getActivityDetail(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId
  if (!userId) {
    fail(res, 'UNAUTHORIZED', 'Usuario no autenticado.', 401)
    return
  }

  const activityId = req.params.activityId as string

  try {
    const activity = await getGardenActivityDetail(activityId, userId)
    ok(res, activity, 'Detalle de la actividad recuperado exitosamente.')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al consultar la actividad.'
    fail(res, 'ACTIVITY_NOT_FOUND', message, 404)
  }
}

export async function voidActivity(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId
  if (!userId) {
    fail(res, 'UNAUTHORIZED', 'Usuario no autenticado.', 401)
    return
  }

  const activityId = req.params.activityId as string
  const { reason } = req.body

  try {
    const result = await voidGardenActivity(activityId, userId, reason || 'Anulación solicitada por el usuario.')
    ok(res, result, 'Actividad anulada y recompensas ajustadas correctamente.')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al anular la actividad.'
    fail(res, 'ACTIVITY_VOID_ERROR', message, 400)
  }
}
