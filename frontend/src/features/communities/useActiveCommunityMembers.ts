import { useCallback, useEffect, useMemo, useState } from 'react'
import { memberApi, type UserSession } from '../../shared/api/client'
import type { Community } from './communities'

interface CommunityMembersContext {
  user: UserSession | null
  activeCommunityId: string | null
  communityRecord: Community | null
}

/** Estado y consultas de miembros aislados de la composición de pantallas. */
export function useActiveCommunityMembers({ user, activeCommunityId, communityRecord }: CommunityMembersContext) {
  const [currentCommunityRole, setCurrentCommunityRole] = useState<'RESPONSABLE' | 'PARTICIPANTE' | null>(null)
  const [activeCommunityMembers, setActiveCommunityMembers] = useState<any[]>([])

  const refreshActiveCommunityMembers = useCallback(async () => {
    if (!user || !activeCommunityId) {
      setCurrentCommunityRole(null)
      setActiveCommunityMembers([])
      return
    }
    try {
      const members = await memberApi.list(activeCommunityId)
      setActiveCommunityMembers(members || [])
      const mine = (members || []).find(m => m.userId === user.id && m.status === 'ACCEPTED')
      if (mine) {
        setCurrentCommunityRole(mine.roleInCommunity === 'RESPONSABLE' ? 'RESPONSABLE' : 'PARTICIPANTE')
      } else if (communityRecord && (communityRecord as any).creatorId === user.id) {
        setCurrentCommunityRole('RESPONSABLE')
      } else {
        setCurrentCommunityRole(user.role === 'RESPONSABLE' ? 'RESPONSABLE' : 'PARTICIPANTE')
      }
    } catch {
      setActiveCommunityMembers([])
      if (communityRecord && (communityRecord as any).creatorId === user.id) {
        setCurrentCommunityRole('RESPONSABLE')
      } else {
        setCurrentCommunityRole(null)
      }
    }
  }, [activeCommunityId, communityRecord, user])

  useEffect(() => { void refreshActiveCommunityMembers() }, [refreshActiveCommunityMembers])

  const acceptedMembersCount = useMemo(() => {
    if (!user) return (communityRecord?.members?.length ?? 0) + 1
    const accepted = activeCommunityMembers.filter(m => m.status === 'ACCEPTED').length
    return accepted > 0 ? accepted : (communityRecord ? 1 : 0)
  }, [user, activeCommunityMembers, communityRecord])

  const pendingCommunityInvitationsCount = useMemo(() => {
    if (!user) return 0
    return activeCommunityMembers.filter(m => m.status === 'PENDING').length
  }, [user, activeCommunityMembers])

  return {
    currentCommunityRole, setCurrentCommunityRole, activeCommunityMembers,
    refreshActiveCommunityMembers, acceptedMembersCount, pendingCommunityInvitationsCount,
  }
}
