// backend/src/shared/middlewares/communityRole.middleware.ts
// Middleware RBAC: verifica que el usuario tenga el rol requerido dentro de la comunidad.

import type { Response, NextFunction } from 'express'
import { fail } from '../utils/response'
import { checkCommunityRole } from '../../modules/communities/community.module'
import type { AuthRequest } from '../types/index'

type CommunityRole = 'RESPONSABLE' | 'CUIDADOR' | 'PARTICIPANTE'

/**
 * Genera un middleware que valida que el usuario autenticado tenga alguno
 * de los roles permitidos (allowedRoles) en la comunidad indicada por :id en la ruta.
 *
 * Uso:
 *   router.put('/:id', requireAuth, requireCommunityRole(['RESPONSABLE']), update)
 */
export function requireCommunityRole(allowedRoles: CommunityRole[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
      return
    }

    const communityId = String(req.params['id'] ?? '')
    if (!communityId) {
      fail(res, 'VALIDATION_ERROR', 'communityId es requerido.', 400)
      return
    }

    try {
      const result = await checkCommunityRole(communityId, req.user.userId, allowedRoles)
      if (result === 'NOT_MEMBER') {
        fail(res, 'FORBIDDEN', 'No eres miembro activo de esta comunidad.', 403)
        return
      }
      if (result === 'FORBIDDEN') {
        const rolesStr = allowedRoles.join(' o ')
        fail(res, 'FORBIDDEN', `No tienes permisos suficientes. Esta acción requiere rol: ${rolesStr}.`, 403)
        return
      }

      next()
    } catch {
      fail(res, 'INTERNAL_ERROR', 'Error al verificar permisos de comunidad.', 500)
    }
  }
}

