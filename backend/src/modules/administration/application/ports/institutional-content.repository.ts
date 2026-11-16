export interface EventCreateData {
  name: string; date: string; province: string; canton: string | null; scope: string; description: string; createdById: string | null
}
export interface ResourceCreateData {
  title: string; kind: string; description: string; fileUrl: string | null; published: boolean; createdById: string | null
}
export interface InstitutionalContentRepository<E, R> {
  listEvents(): Promise<E[]>
  createEvent(data: EventCreateData): Promise<E>
  deleteEvent(id: string): Promise<E>
  listResources(): Promise<R[]>
  createResource(data: ResourceCreateData): Promise<R>
  deleteResource(id: string): Promise<R>
}
