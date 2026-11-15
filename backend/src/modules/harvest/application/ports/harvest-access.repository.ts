/** Lecturas mínimas para autorizar consultas y registro de cosechas. */
export interface HarvestAccessRepository {
  findPlantGardenId(plantId: string): Promise<string | null>
  findCommunityCreator(communityId: string): Promise<string | null>
  findMembershipStatus(communityId: string, userId: string): Promise<string | null>
}
