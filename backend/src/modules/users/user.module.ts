import { createUserLookupService } from './application/user-lookup.service'
import { prismaUserLookupRepository } from './infrastructure/prisma-user-lookup.repository'

export const lookupUserByEmail = createUserLookupService(prismaUserLookupRepository)
