// Tipos compartidos del backend Kawsapacha V1
// Responsable: Ronny Veloz (#4 ARQ-001)

// ─── Respuestas HTTP estandarizadas ──────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  ok: true
  message: string
  data: T
}

export interface ApiError {
  ok: false
  error: {
    code: string
    message: string
    details?: Record<string, string>
  }
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

// ─── Autenticación ────────────────────────────────────────────────────────────

export type UserRole = 'ADMIN_TECNICO' | 'ADMIN_MSP' | 'USUARIO'

export interface JwtPayload {
  userId: string
  email: string
  role: UserRole
}

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  role: UserRole
  isActive?: boolean
}

// ─── Express: Request extendido con usuario autenticado ──────────────────────

import type { Request } from 'express'

export interface AuthRequest extends Request {
  user?: JwtPayload
}

