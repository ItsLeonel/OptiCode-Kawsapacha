import type { UserRole } from '../../../shared/types/index'
import type { GlobalRoleRepository } from './ports/global-role.repository'

export function createGlobalRoleService(repository: GlobalRoleRepository) {
  return async function checkGlobalRole(userId: string, allowedRoles: UserRole[]) {
    const user = await repository.findUserRole(userId)
    if (!user) return { status: 'USER_NOT_FOUND' as const }
    if (!user.isActive) return { status: 'ACCOUNT_DEACTIVATED' as const }
    const role = user.role as UserRole
    if (!allowedRoles.includes(role)) return { status: 'FORBIDDEN' as const }
    return { status: 'ALLOWED' as const, role }
  }
}
