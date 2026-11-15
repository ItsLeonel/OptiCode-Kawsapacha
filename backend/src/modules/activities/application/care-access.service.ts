import type { CareAccessRepository } from './ports/care-access.repository'

/** La autorización de huerto se inyecta en el punto de composición. */
export function createCarePlantAccessService(
  repository: CareAccessRepository,
  assertGardenAccess: (gardenId: string, userId: string, options?: { requireApproved?: boolean }) => Promise<boolean>,
) {
  return async function requireCarePlantAccess(plantId: string, userId: string, approved: boolean): Promise<void> {
    const gardenId = await repository.findGardenIdByPlant(plantId)
    if (!gardenId) throw Object.assign(new Error('Planta no encontrada.'), { code: 'NOT_FOUND' })
    await assertGardenAccess(gardenId, userId, { requireApproved: approved })
  }
}
