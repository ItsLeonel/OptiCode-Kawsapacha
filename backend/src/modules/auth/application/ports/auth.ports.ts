/** Contratos de la capa de aplicación, sin ORM ni algoritmos criptográficos concretos. */
import type { JwtPayload } from '../../../../shared/types/index'

export interface AuthUserRecord {
  id: string
  name: string
  email: string
  passwordHash: string
  role: string
  isActive: boolean
}

export interface AuthUserRepository {
  findByEmails(normalizedEmail: string, trimmedEmail: string): Promise<AuthUserRecord | null>
  create(data: {
    name: string
    email: string
    passwordHash: string
    role: 'USUARIO'
    isActive: true
  }): Promise<AuthUserRecord>
  findById(id: string): Promise<AuthUserRecord | null>
}

export interface PasswordHasher {
  hash(password: string, saltRounds: number): Promise<string>
  compare(password: string, passwordHash: string): Promise<boolean>
}

export interface TokenSigner {
  sign(payload: JwtPayload): string
}
