export interface CommunityRoleRepository {
  findAcceptedRole(communityId: string, userId: string): Promise<string | null>
}
