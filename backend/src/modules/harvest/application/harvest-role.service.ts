import type { HarvestAccessRepository } from './ports/harvest-access.repository'

export function createHarvestRoleService(repository: HarvestAccessRepository) {
  return async function checkHarvestPermission(
    plantId: string, userId: string,
  ): Promise<'ALLOWED' | 'PLANT_NOT_FOUND' | 'GARDEN_NOT_FOUND' | 'NOT_MEMBER' | 'INSUFFICIENT_ROLE' | 'NOT_CREATOR'> {
    const gardenId = await repository.findPlantGardenId(plantId)
    if (!gardenId) return 'PLANT_NOT_FOUND'
    const garden = await repository.findHarvestGarden(gardenId)
    if (!garden) return 'GARDEN_NOT_FOUND'
    if (garden.communityId) {
      const role = await repository.findAcceptedHarvestRole(garden.communityId, userId)
      if (!role) return 'NOT_MEMBER'
      return role === 'RESPONSABLE' || role === 'CUIDADOR' ? 'ALLOWED' : 'INSUFFICIENT_ROLE'
    }
    return garden.createdById === userId ? 'ALLOWED' : 'NOT_CREATOR'
  }
}
