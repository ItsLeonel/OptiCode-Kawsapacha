import type { ResourceInput } from '../../domain/resource'

export interface ResourceRepository<T> {
  findMany(communityId: string): Promise<T[]>
  create(communityId: string, data: ResourceInput): Promise<T>
  update(resourceId: string, data: Partial<ResourceInput>): Promise<T>
  delete(resourceId: string): Promise<T>
}
