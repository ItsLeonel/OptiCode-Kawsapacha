import type { InstitutionalContentRepository } from './ports/institutional-content.repository'

/** Casos de uso sin dependencias del motor de persistencia. */
export function createInstitutionalContentService<E, R>(repository: InstitutionalContentRepository<E, R>) {
  return {
    listInstitutionalEvents() {
      // No generar eventos ficticios al leer una lista vacía.
      return repository.listEvents()
    },
    async createInstitutionalEvent(input: {
      name: string; date: string; province?: string; canton?: string; scope?: string; description?: string; createdById?: string
    }) {
      if (!input.name?.trim()) throw new Error('El nombre del evento es obligatorio.')
      if (!input.date?.trim()) throw new Error('La fecha del evento es obligatoria.')
      return repository.createEvent({
        name: input.name.trim(),
        date: input.date.trim(),
        province: input.province?.trim() || 'Pichincha',
        canton: input.canton?.trim() || null,
        scope: input.scope?.trim() || 'NACIONAL',
        description: input.description?.trim() || '',
        createdById: input.createdById || null,
      })
    },
    deleteInstitutionalEvent(id: string) { return repository.deleteEvent(id) },
    listEducationalResources() {
      // Leer no debe insertar demos ni cambiar URLs legítimas de PDF.
      return repository.listResources()
    },
    async createEducationalResource(input: {
      title: string; kind?: string; description?: string; fileUrl?: string; published?: boolean; createdById?: string
    }) {
      if (!input.title?.trim()) throw new Error('El título del recurso es obligatorio.')
      const fileUrl = input.fileUrl?.trim()
      if (fileUrl) {
        const internalDoc = /^\/docs\/[a-zA-Z0-9/_-]+\.html$/.test(fileUrl) && !fileUrl.includes('..')
        let externalLink = false
        try {
          const parsed = new URL(fileUrl)
          externalLink = (parsed.protocol === 'https:' || parsed.protocol === 'http:') && !parsed.username && !parsed.password
        } catch { /* Ruta relativa: solo permitir documentos internos conocidos. */ }
        if (!internalDoc && !externalLink) {
          throw new Error('El enlace debe utilizar HTTPS/HTTP o apuntar a un documento interno /docs/*.html.')
        }
      }
      return repository.createResource({
        title: input.title.trim(),
        kind: input.kind?.trim() || 'GUIA',
        description: input.description?.trim() || '',
        fileUrl: fileUrl || null,
        published: input.published ?? true,
        createdById: input.createdById || null,
      })
    },
    deleteEducationalResource(id: string) { return repository.deleteResource(id) },
  }
}
