import type { Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { fail } from '../utils/response'
import { prisma } from '../config/prisma'
import type { AuthRequest, UserRole } from '../types'

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    fail(res, 'UNAUTHORIZED', 'Se requiere iniciar sesión para acceder a este recurso.', 401)
    return
  }
  const token = header.slice(7)
  try {
    req.user = verifyToken(token)
    next()
  } catch {
    fail(res, 'INVALID_TOKEN', 'La sesión es inválida o ha expirado. Inicia sesión nuevamente.', 401)
  }
}

/**
 * Middleware RBAC Global: Verifica que el usuario autenticado tenga uno de los roles globales permitidos
 * y consulta directamente la Base de Datos para asegurar que el rol no haya sido revocado y la cuenta siga activa.
 */
export function requireGlobalRole(allowedRoles: UserRole[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      fail(res, 'UNAUTHORIZED', 'Se requiere iniciar sesión para acceder a este recurso.', 401)
      return
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { id: true, role: true, isActive: true },
      })

      if (!user) {
        fail(res, 'USER_NOT_FOUND', 'El usuario no existe o fue eliminado.', 401)
        return
      }

      if (!user.isActive) {
        fail(res, 'ACCOUNT_DEACTIVATED', 'Tu cuenta se encuentra desactivada.', 403)
        return
      }

      const currentRole = user.role as UserRole
      if (!allowedRoles.includes(currentRole)) {
        fail(res, 'FORBIDDEN', `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}.`, 403)
        return
      }

      // Sincronizar rol actual confirmado por la base de datos
      req.user.role = currentRole
      next()
    } catch {
      fail(res, 'INTERNAL_ERROR', 'Error al verificar permisos de usuario.', 500)
    }
  }
}

