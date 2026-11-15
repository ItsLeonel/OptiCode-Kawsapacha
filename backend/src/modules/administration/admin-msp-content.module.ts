import { createInstitutionalContentService } from './application/admin-msp-content.service'
import { prismaInstitutionalContentRepository } from './infrastructure/prisma-institutional-content.repository'

export const { listInstitutionalEvents, createInstitutionalEvent, deleteInstitutionalEvent,
  listEducationalResources, createEducationalResource, deleteEducationalResource } =
  createInstitutionalContentService(prismaInstitutionalContentRepository)
