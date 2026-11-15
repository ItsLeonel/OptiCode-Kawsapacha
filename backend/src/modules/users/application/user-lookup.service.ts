import type { UserLookupRepository } from './ports/user-lookup.repository'

export function createUserLookupService(repository: UserLookupRepository) {
  return async function lookupUserByEmail(rawEmail: string, communityId: string) {
    const cleanEmail = rawEmail.toLowerCase()
    const user = await repository.findUserByEmail(rawEmail, cleanEmail)
    if (!user) {
      return { found: false, message: 'No existe ningún usuario registrado con este correo.' }
    }
    let isMember = false
    let isPending = false
    let roleInCommunity: string | null = null
    if (communityId) {
      const membership = await repository.findMembership(communityId, user.id)
      if (membership) {
        roleInCommunity = membership.roleInCommunity
        if (membership.status === 'ACCEPTED') isMember = true
        else if (membership.status === 'PENDING') isPending = true
      } else {
        const pendingInvite = await repository.findPendingInvitation(communityId, cleanEmail, user.email)
        if (pendingInvite) {
          isPending = true
          roleInCommunity = pendingInvite.role
        }
      }
    }
    return { found: true, user, isMember, isPending, roleInCommunity }
  }
}
