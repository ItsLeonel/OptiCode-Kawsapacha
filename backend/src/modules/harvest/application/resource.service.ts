import type { ResourceInput } from '../domain/resource'
import type { ResourceRepository } from './ports/resource.repository'

/** Casos de uso sin dependencia directa de Prisma, SQLite o HTTP. */
export function createResourceService<T>(repository: ResourceRepository<T>) {
  return {
    listResources: (communityId: string) => repository.findMany(communityId),
    createResource: (communityId: string, data: ResourceInput) => repository.create(communityId, data),
    updateResource: (resourceId: string, data: Partial<ResourceInput>) => repository.update(resourceId, data),
    deleteResource: (resourceId: string) => repository.delete(resourceId),
  }
}
