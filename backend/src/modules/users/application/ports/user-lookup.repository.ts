export interface LookupUser { id: string; name: string; email: string }
export interface LookupMembership { status: string; roleInCommunity: string }
export interface LookupInvitation { role: string }

/** Consultas necesarias sin acoplar el caso de uso a Prisma. */
export interface UserLookupRepository {
  findUserByEmail(rawEmail: string, cleanEmail: string): Promise<LookupUser | null>
  findMembership(communityId: string, userId: string): Promise<LookupMembership | null>
  findPendingInvitation(communityId: string, cleanEmail: string, userEmail: string): Promise<LookupInvitation | null>
}
