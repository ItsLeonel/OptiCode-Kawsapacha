import { createTechnicalAdminService } from './application/admin-technical.service'
import { prismaTechnicalAdminRepository, technicalPasswordHasher } from './infrastructure/prisma-technical-admin.repository'
import { logAudit } from './audit.module'

export const {provisionMspUser,toggleUserStatus,listAdministrativeUsers}=
 createTechnicalAdminService(prismaTechnicalAdminRepository,technicalPasswordHasher,logAudit)
