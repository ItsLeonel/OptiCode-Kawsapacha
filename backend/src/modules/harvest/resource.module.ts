import { createResourceService } from './application/resource.service'
import { prismaResourceRepository } from './infrastructure/prisma-resource.repository'

/** Composición única: capa de aplicación + puerto + adaptador concreto. */
export const { listResources, createResource, updateResource, deleteResource } =
  createResourceService(prismaResourceRepository)
