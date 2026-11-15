import type { AuthenticatedUser } from '../../../shared/types/index'
import { normalizeAuthEmail, normalizeGlobalRole } from '../domain/auth-rules'
import type { AuthUserRepository, PasswordHasher, TokenSigner } from './ports/auth.ports'

const SALT_ROUNDS = 10

/** Casos de uso de identidad: ORM, hashing y tokens se inyectan en la composición. */
export function createAuthService(repository: AuthUserRepository, hasher: PasswordHasher, tokens: TokenSigner) {
  return {
    async registerUser(name: string, email: string, password: string): Promise<{ token: string; user: AuthenticatedUser }> {
      const normalizedEmail = normalizeAuthEmail(email)
      const existing = await repository.findByEmails(normalizedEmail, email.trim())
      if (existing) throw Object.assign(new Error('Ya existe una cuenta con ese correo electrónico.'), { code: 'EMAIL_IN_USE' })

      const passwordHash = await hasher.hash(password, SALT_ROUNDS)
      // El registro público SIEMPRE crea usuarios con rol USUARIO.
      const user = await repository.create({ name: name.trim(), email: normalizedEmail, passwordHash, role: 'USUARIO', isActive: true })
      const token = tokens.sign({ userId: user.id, email: user.email, role: 'USUARIO' })
      return { token, user: { id: user.id, name: user.name, email: user.email, role: 'USUARIO', isActive: true } }
    },

    async loginUser(email: string, password: string): Promise<{ token: string; user: AuthenticatedUser }> {
      const normalizedEmail = normalizeAuthEmail(email)
      const user = await repository.findByEmails(normalizedEmail, email.trim())
      const valid = user ? await hasher.compare(password, user.passwordHash) : false
      if (!user || !valid) throw Object.assign(new Error('Correo o contraseña incorrectos.'), { code: 'INVALID_CREDENTIALS' })
      if (!user.isActive) throw Object.assign(new Error('Tu cuenta se encuentra desactivada. Contacta al soporte técnico.'), { code: 'ACCOUNT_DEACTIVATED' })

      const role = normalizeGlobalRole(user.role)
      const token = tokens.sign({ userId: user.id, email: user.email, role })
      return { token, user: { id: user.id, name: user.name, email: user.email, role, isActive: user.isActive } }
    },

    async getUserById(id: string): Promise<AuthenticatedUser | null> {
      const user = await repository.findById(id)
      if (!user) return null
      const role = normalizeGlobalRole(user.role)
      return { id: user.id, name: user.name, email: user.email, role, isActive: user.isActive }
    },
  }
}
