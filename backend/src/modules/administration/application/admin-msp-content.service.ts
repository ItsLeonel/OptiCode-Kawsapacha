import { prisma } from '../../../infrastructure/database/prisma'

// ─── EVENTOS INSTITUCIONALES DEL MSP ──────────────────────────────────────────

export async function listInstitutionalEvents() {
  // No generar eventos ficticios al leer una lista vacía.
  return prisma.mspInstitutionalEvent.findMany({
    orderBy: { date: 'asc' },
  })
}

export async function createInstitutionalEvent(input: {
  name: string
  date: string
  province?: string
  canton?: string
  scope?: string
  description?: string
  createdById?: string
}) {
  if (!input.name?.trim()) throw new Error('El nombre del evento es obligatorio.')
  if (!input.date?.trim()) throw new Error('La fecha del evento es obligatoria.')

  return prisma.mspInstitutionalEvent.create({
    data: {
      name: input.name.trim(),
      date: input.date.trim(),
      province: input.province?.trim() || 'Pichincha',
      canton: input.canton?.trim() || null,
      scope: input.scope?.trim() || 'NACIONAL',
      description: input.description?.trim() || '',
      createdById: input.createdById || null,
    },
  })
}

export async function deleteInstitutionalEvent(id: string) {
  return prisma.mspInstitutionalEvent.delete({ where: { id } })
}

// ─── RECURSOS EDUCATIVOS DEL MSP ──────────────────────────────────────────────

export async function listEducationalResources() {
  // Leer no debe insertar demos ni cambiar URLs legítimas de PDF.
  return prisma.mspEducationalResource.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function createEducationalResource(input: {
  title: string
  kind?: string
  description?: string
  fileUrl?: string
  published?: boolean
  createdById?: string
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

  return prisma.mspEducationalResource.create({
    data: {
      title: input.title.trim(),
      kind: input.kind?.trim() || 'GUIA',
      description: input.description?.trim() || '',
      fileUrl: fileUrl || null,
      published: input.published ?? true,
      createdById: input.createdById || null,
    },
  })
}

export async function deleteEducationalResource(id: string) {
  return prisma.mspEducationalResource.delete({ where: { id } })
}
