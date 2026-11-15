// backend/src/modules/rewards/presentation/rewards.controller.ts
import type { Response } from 'express'
import type { AuthRequest } from '../../../shared/types/index'
import { ok, fail } from '../../../shared/utils/response'
import { getUserRewardsSummary } from '../application/rewards.service'
import { syncUserMissionsAndBadges } from '../application/missions.service'

export async function getMyRewards(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId
  if (!userId) {
    fail(res, 'UNAUTHORIZED', 'Usuario no autenticado.', 401)
    return
  }

  try {
    // Sincronizar misiones basadas en actividades reales antes de devolver
    await syncUserMissionsAndBadges(userId)
    const summary = await getUserRewardsSummary(userId)
    ok(res, summary, 'Balance de Semillas de vida, misiones e insignias recuperado exitosamente.')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al obtener recompensas.'
    fail(res, 'REWARDS_ERROR', message, 500)
  }
}

