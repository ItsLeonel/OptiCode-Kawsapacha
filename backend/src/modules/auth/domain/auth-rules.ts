/** Normalización de acceso, sin dependencias de Prisma ni Express. */
export type GlobalRole = 'ADMIN_TECNICO' | 'ADMIN_MSP' | 'USUARIO'

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function normalizeGlobalRole(role: string): GlobalRole {
  return (['ADMIN_TECNICO', 'ADMIN_MSP', 'USUARIO'].includes(role) ? role : 'USUARIO') as GlobalRole
}
