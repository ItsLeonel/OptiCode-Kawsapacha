import { prisma } from '../../../infrastructure/database/prisma'
import type { EventCreateData, ResourceCreateData } from '../application/ports/institutional-content.repository'

/** Adaptador técnico: consulta y persistencia Prisma, sin reglas de negocio. */
export const prismaInstitutionalContentRepository = {
  listEvents() { return prisma.mspInstitutionalEvent.findMany({ orderBy: { date: 'asc' } }) },
  createEvent(data: EventCreateData) { return prisma.mspInstitutionalEvent.create({ data }) },
  deleteEvent(id: string) { return prisma.mspInstitutionalEvent.delete({ where: { id } }) },
  listResources() { return prisma.mspEducationalResource.findMany({ orderBy: { createdAt: 'desc' } }) },
  createResource(data: ResourceCreateData) { return prisma.mspEducationalResource.create({ data }) },
  deleteResource(id: string) { return prisma.mspEducationalResource.delete({ where: { id } }) },
}
