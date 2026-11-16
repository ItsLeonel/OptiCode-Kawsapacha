import bcrypt from 'bcryptjs'
import { prisma } from '../../../infrastructure/database/prisma'
import { signToken } from '../../../shared/utils/jwt'
import type { AuthUserRepository, PasswordHasher, TokenSigner } from '../application/ports/auth.ports'

export const prismaAuthUserRepository: AuthUserRepository = {
  findByEmails(normalizedEmail, trimmedEmail) {
    return prisma.user.findFirst({ where: { OR: [{ email: normalizedEmail }, { email: trimmedEmail }] } })
  },
  create(data) {
    return prisma.user.create({ data })
  },
  findById(id) {
    return prisma.user.findUnique({ where: { id } })
  },
}

export const bcryptPasswordHasher: PasswordHasher = {
  hash(password, saltRounds) { return bcrypt.hash(password, saltRounds) },
  compare(password, passwordHash) { return bcrypt.compare(password, passwordHash) },
}
export const jwtTokenSigner: TokenSigner = { sign: signToken }
