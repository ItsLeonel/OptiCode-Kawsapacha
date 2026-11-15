import type { Response } from 'express'
import { lookupUserByEmail } from '../user.module'
import { ok, fail } from '../../../shared/utils/response'
import type { AuthRequest } from '../../../shared/types/index'

/** Contrato HTTP conservado: validación y formato de respuesta viven en presentación. */
export async function lookupUser(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)

  const rawEmail = String(req.query['email'] ?? '').trim()
  const communityId = String(req.query['communityId'] ?? '').trim()
  if (!rawEmail) return void fail(res, 'VALIDATION_ERROR', 'El correo electrónico es obligatorio.', 400)

  try {
    const result = await lookupUserByEmail(rawEmail, communityId)
    if (!result.found) return void ok(res, result)
    ok(res, result, 'Usuario consultado con éxito.')
  } catch {
    fail(res, 'INTERNAL_ERROR', 'Error al consultar el usuario.', 500)
  }
}
