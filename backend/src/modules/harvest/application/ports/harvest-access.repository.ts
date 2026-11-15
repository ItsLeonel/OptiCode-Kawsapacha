/** Lecturas mínimas para autorizar consultas y registro de cosechas. */
export interface HarvestAccessRepository {
  findPlantGardenId(plantId: string): Promise<string | null>
  findCommunityCreator(communityId: string): Promise<string | null>
  findMembershipStatus(communityId: string, userId: string): Promise<string | null>
  findHarvestGarden(gardenId: string): Promise<{ communityId: string | null; createdById: string } | null>
  findAcceptedHarvestRole(communityId: string, userId: string): Promise<string | null>
}
