export interface GardenAccessRecord {
 id: string; createdById: string; communityId: string | null;
 community: { id: string; status: string; name: string; reviewReason: string | null } | null;
}
export interface GardenAccessRepository {
 findGarden(gardenId: string): Promise<GardenAccessRecord | null>
 findMembershipStatus(communityId: string, userId: string): Promise<string | null>
}
