import bcrypt from 'bcryptjs'
import { prisma } from '../config/prisma'
import { signToken } from '../utils/jwt'
import type { AuthenticatedUser } from '../types'

const SALT_ROUNDS = 10

export async function registerUser(name: string, email: string, password: string): Promise<{ token: string; user: AuthenticatedUser }> {
  const normalizedEmail = email.trim().toLowerCase()
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizedEmail },
        { email: email.trim() },
      ],
    },
  })
  if (existing) throw Object.assign(new Error('Ya existe una cuenta con ese correo electrónico.'), { code: 'EMAIL_IN_USE' })

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await prisma.user.create({
    data: { name: name.trim(), email: normalizedEmail, passwordHash, role: 'PARTICIPANTE' },
  })

  const token = signToken({ userId: user.id, email: user.email, role: 'PARTICIPANTE' })
  return { token, user: { id: user.id, name: user.name, email: user.email, role: 'PARTICIPANTE' } }
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: AuthenticatedUser }> {
  const normalizedEmail = email.trim().toLowerCase()
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizedEmail },
        { email: email.trim() },
      ],
    },
  })
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false
  // Respuesta genérica para no revelar si el correo existe o no
  if (!user || !valid) throw Object.assign(new Error('Correo o contraseña incorrectos.'), { code: 'INVALID_CREDENTIALS' })

  const role = user.role as 'RESPONSABLE' | 'PARTICIPANTE'
  const token = signToken({ userId: user.id, email: user.email, role })
  return { token, user: { id: user.id, name: user.name, email: user.email, role } }
}

export async function getUserById(id: string): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return null
  return { id: user.id, name: user.name, email: user.email, role: user.role as 'RESPONSABLE' | 'PARTICIPANTE' }
}
