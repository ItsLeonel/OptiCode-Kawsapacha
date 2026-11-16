import type { HarvestAccessRepository } from './ports/harvest-access.repository'

export function createHarvestAccessService(repository: HarvestAccessRepository) {
  async function findHarvestPlantGardenId(plantId: string): Promise<string | null> {
    return repository.findPlantGardenId(plantId)
  }
  async function checkCommunityHarvestAccess(
    communityId: string, userId: string,
  ): Promise<'ALLOWED' | 'FORBIDDEN' | 'NOT_FOUND'> {
    const creatorId = await repository.findCommunityCreator(communityId)
    if (!creatorId) return 'NOT_FOUND'
    if (creatorId === userId) return 'ALLOWED'
    const status = await repository.findMembershipStatus(communityId, userId)
    return status === 'ACCEPTED' ? 'ALLOWED' : 'FORBIDDEN'
  }
  return { findHarvestPlantGardenId, checkCommunityHarvestAccess }
}
