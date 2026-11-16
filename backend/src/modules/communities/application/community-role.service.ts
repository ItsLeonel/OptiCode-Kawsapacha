import type { CommunityRoleRepository } from './ports/community-role.repository'

export type CommunityRole = 'RESPONSABLE' | 'CUIDADOR' | 'PARTICIPANTE'
export function createCommunityRoleService(repository: CommunityRoleRepository) {
  return async function checkCommunityRole(
    communityId: string, userId: string, allowedRoles: CommunityRole[],
  ): Promise<'ALLOWED' | 'NOT_MEMBER' | 'FORBIDDEN'> {
    const role = await repository.findAcceptedRole(communityId, userId)
    if (!role) return 'NOT_MEMBER'
    return allowedRoles.includes(role as CommunityRole) ? 'ALLOWED' : 'FORBIDDEN'
  }
}
