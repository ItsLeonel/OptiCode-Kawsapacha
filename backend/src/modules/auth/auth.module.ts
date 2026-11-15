import { createAuthService } from './application/auth.service'
import { prismaAuthUserRepository, bcryptPasswordHasher, jwtTokenSigner } from './infrastructure/auth-adapters'

export const { registerUser, loginUser, getUserById } =
  createAuthService(prismaAuthUserRepository, bcryptPasswordHasher, jwtTokenSigner)

import { createGlobalRoleService } from './application/global-role.service'
import { prismaGlobalRoleRepository } from './infrastructure/prisma-global-role.repository'
export const checkGlobalRole = createGlobalRoleService(prismaGlobalRoleRepository)
