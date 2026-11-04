import type { Request, Response } from 'express'
import { registerUser, loginUser, getUserById } from '../services/auth.service'
import { ok, fail } from '../utils/response'
import type { AuthRequest } from '../types'

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string }

  if (!name?.trim() || name.trim().length < 2)
    return void fail(res, 'VALIDATION_ERROR', 'El nombre debe tener al menos 2 caracteres.', 400, { name: 'El nombre debe tener al menos 2 caracteres.' })
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return void fail(res, 'VALIDATION_ERROR', 'Escribe un correo electrónico válido.', 400, { email: 'Escribe un correo electrónico válido.' })
  if (!password || password.length < 8 || !/\p{L}/u.test(password) || !/\d/.test(password))
    return void fail(res, 'VALIDATION_ERROR', 'La contraseña debe tener al menos 8 caracteres, una letra y un número.', 400, { password: 'Usa al menos 8 caracteres, una letra y un número.' })

  try {
    const result = await registerUser(name.trim(), email.trim(), password)
    ok(res, result, 'Usuario registrado exitosamente.', 201)
  } catch (err: unknown) {
    const e = err as { code?: string; message: string }
    if (e.code === 'EMAIL_IN_USE') fail(res, 'EMAIL_IN_USE', e.message, 409, { email: e.message })
    else fail(res, 'INTERNAL_ERROR', 'Error al registrar el usuario.', 500)
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string }

  if (!email?.trim()) return void fail(res, 'VALIDATION_ERROR', 'Escribe tu correo electrónico.', 400)
  if (!password) return void fail(res, 'VALIDATION_ERROR', 'Escribe tu contraseña.', 400)

  try {
    const result = await loginUser(email.trim(), password)
    ok(res, result, 'Sesión iniciada correctamente.')
  } catch (err: unknown) {
    const e = err as { code?: string; message: string }
    if (e.code === 'INVALID_CREDENTIALS') fail(res, 'INVALID_CREDENTIALS', e.message, 401)
    else fail(res, 'INTERNAL_ERROR', 'Error al iniciar sesión.', 500)
  }
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return void fail(res, 'UNAUTHORIZED', 'No autenticado.', 401)
  const user = await getUserById(req.user.userId)
  if (!user) return void fail(res, 'NOT_FOUND', 'Usuario no encontrado.', 404)
  ok(res, { user }, 'Usuario autenticado.')
}

