import type { GardenAccessRepository } from './ports/garden-access.repository'

/** Regla de autorización independiente de Prisma y HTTP. */
export function createGardenAccessService(repository: GardenAccessRepository) {
 return async function assertGardenAccess(gardenId: string, userId: string, options?: { requireApproved?: boolean }): Promise<boolean> {
  const requireApproved = options?.requireApproved ?? true
  const garden = await repository.findGarden(gardenId)
  if (!garden) throw new Error('El huerto especificado no existe.')
  if (requireApproved && garden.community && ['REJECTED', 'SUSPENDED'].includes(garden.community.status)) {
   throw Object.assign(new Error('La comunidad está rechazada o suspendida. Solicita su revisión antes de registrar nuevas actividades.'), { code: 'COMMUNITY_NOT_APPROVED' })
  }
  if (garden.createdById === userId) return true
  if (garden.communityId) {
   const status = await repository.findMembershipStatus(garden.communityId, userId)
   if (status === 'ACCEPTED') return true
  }
  throw Object.assign(new Error('No tienes permisos para interactuar con este huerto.'), { code: 'FORBIDDEN' })
 }
}
