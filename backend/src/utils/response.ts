import type { Response } from 'express'
import type { ApiSuccess, ApiError } from '../types'

export function ok<T>(res: Response, data: T, message = 'OK', status = 200): void {
  const body: ApiSuccess<T> = { ok: true, message, data }
  res.status(status).json(body)
}

export function fail(
  res: Response,
  code: string,
  message: string,
  status = 400,
  details?: Record<string, string>
): void {
  const body: ApiError = { ok: false, error: { code, message, ...(details && { details }) } }
  res.status(status).json(body)
}

