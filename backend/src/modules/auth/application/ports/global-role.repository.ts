export interface GlobalRoleUser { role: string; isActive: boolean }
export interface GlobalRoleRepository {
  findUserRole(userId: string): Promise<GlobalRoleUser | null>
}
