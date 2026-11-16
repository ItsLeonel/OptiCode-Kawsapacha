import type { Request, Response, NextFunction } from 'express'
import { fail } from '../utils/response'
import { MulterError } from 'multer'

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[ERROR]', err.message)
  if (err instanceof MulterError && err.code !== 'LIMIT_FILE_SIZE') {
    fail(res, 'INVALID_UPLOAD', 'Envía una sola fotografía en el campo picture.', 400)
    return
  }

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

