import type { Request, Response, NextFunction } from 'express'
import { fail } from '../utils/response'

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[ERROR]', err.message)

  // Errores de Multer (tamaño o tipo de archivo)
  if (err.message.includes('File too large')) {
    fail(res, 'FILE_TOO_LARGE', 'La imagen no puede superar los 3 MB.', 400)
    return
  }
  if (err.message.includes('Solo se permiten')) {
    fail(res, 'INVALID_FILE_TYPE', err.message, 400)
    return
  }

  // Error genérico del servidor
  fail(res, 'INTERNAL_ERROR', 'Error interno del servidor. Inténtalo más tarde.', 500)
}

