import { createAuthService } from './application/auth.service'
import { prismaAuthUserRepository, bcryptPasswordHasher, jwtTokenSigner } from './infrastructure/auth-adapters'

export const { registerUser, loginUser, getUserById } =
  createAuthService(prismaAuthUserRepository, bcryptPasswordHasher, jwtTokenSigner)
