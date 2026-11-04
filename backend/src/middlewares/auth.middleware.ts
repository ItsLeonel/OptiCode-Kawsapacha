import type { Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { fail } from '../utils/response'
import type { AuthRequest } from '../types'

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

