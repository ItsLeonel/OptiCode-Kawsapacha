import type { Dispatch, SetStateAction } from 'react'
import { communityApi, gardenApi, memberApi, type UserSession } from '../shared/api/client'
import type { Community } from '../features/communities/communities'
import { parseRealGarden, toGardenDraft, type RealGarden, type RealGardenDraft } from '../features/real-gardens/real-garden'
import { matchesCommunityLocation, withCommunityLocation } from '../features/real-gardens/garden-community-location'
import { recordId } from '../features/my-garden/plant-record'
import { useGardenJournal } from '../features/my-garden/journal/useGardenJournal'

type SetupActionsContext = {
  user: UserSession | null
  activeCommunityId: string | null
  communityRecord: Community | null
  activeGardenId: string | null
  backendGarden: RealGarden | null
  communityEntry: 'create' | 'join' | null
  journal: ReturnType<typeof useGardenJournal>
  setActiveCommunityId: Dispatch<SetStateAction<string | null>>
  setActiveGardenId: Dispatch<SetStateAction<string | null>>
  setBackendCommunity: Dispatch<SetStateAction<Community | null>>
  setBackendGarden: Dispatch<SetStateAction<RealGarden | null>>
  setRealGardenDraft: Dispatch<SetStateAction<RealGardenDraft>>
  setUserCommunities: Dispatch<SetStateAction<Community[]>>
  setNotice: Dispatch<SetStateAction<string>>
  loadGardenForCommunity: (id: string) => Promise<void>
  handleMembersUpdated: () => Promise<void>
  goto: (next: 'Inicio') => void
}

/** Acciones de registro y edición de comunidad/huerto fuera del componente raíz. */
export function createGardenSetupActions({user, activeCommunityId, communityRecord, activeGardenId, backendGarden, communityEntry, journal, setActiveCommunityId, setActiveGardenId, setBackendCommunity, setBackendGarden, setRealGardenDraft, setUserCommunities, setNotice, loadGardenForCommunity, handleMembersUpdated, goto}: SetupActionsContext) {
  async function saveCommunity(next: Community) {
    if (user) {
      try {
        const targetId = (next as any).id || activeCommunityId || (communityRecord as any)?.id
        let savedCommunity: Community & { id: string }
        const isEditing = Boolean(targetId)

        if (isEditing) {
          savedCommunity = await communityApi.update(targetId, next)
          setNotice('¡Comunidad actualizada con éxito!')
        } else {
          savedCommunity = await communityApi.create(next)
          setActiveCommunityId(savedCommunity.id)
          setNotice('¡Comunidad guardada con éxito en la base de datos!')
        }

        setBackendCommunity(savedCommunity)
        const list = await communityApi.list()
        setUserCommunities(list || [])

        // Si se editó la comunidad y hay huerto real asociado, sincronizar ubicación si cambió
        if (isEditing && activeGardenId && backendGarden && matchesCommunityLocation(toGardenDraft(backendGarden), communityRecord) &&
          (next.province !== communityRecord?.province || next.cantonCode !== communityRecord?.cantonCode || next.parishCode !== communityRecord?.parishCode)) {
          try {
            const parsed = parseRealGarden(withCommunityLocation(toGardenDraft(backendGarden), savedCommunity), savedCommunity.name)
            if (parsed.ok) {
              const updatedGarden = await gardenApi.update(activeGardenId, parsed.garden, savedCommunity.id)
              setBackendGarden(updatedGarden)
              setRealGardenDraft(toGardenDraft(updatedGarden))
            }
          } catch {}
        }

        const membersToInvite = (next.members || []).filter(
          m => m.email && m.email.trim() && (m.inviteStatus === 'ready_to_send' || (m.inviteStatus !== 'sent' && m.inviteStatus !== 'already_member' && m.inviteStatus !== 'pending'))
        )
        if (membersToInvite.length > 0) {
          const results = await Promise.allSettled(
            membersToInvite.map(m =>
              memberApi.invite(
                savedCommunity.id,
                m.email!.trim().toLowerCase(),
                m.role || 'PARTICIPANTE'
              )
            )
          )
          const successful = results.filter(r => r.status === 'fulfilled').length
          const rejected = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[]
          if (successful > 0 && rejected.length === 0) {
            setNotice(`¡Comunidad guardada y se enviaron ${successful} solicitud(es) de integrante!`)
          } else if (successful > 0 && rejected.length > 0) {
            setNotice(`¡Comunidad guardada! Se enviaron ${successful} invitación(es) (${rejected.length} fallaron o usuario no registrado).`)
          } else if (rejected.length > 0) {
            const errMsg = rejected[0].reason instanceof Error ? rejected[0].reason.message : 'Verifica que los correos existan'
            setNotice(`¡Comunidad guardada! No se pudieron enviar solicitudes: ${errMsg}`)
          }
        }

        if (savedCommunity.id) {
          try {
            await handleMembersUpdated()
          } catch {}
        }

        if (communityEntry === 'create') goto('Inicio')
      } catch (err: unknown) {
        setNotice(err instanceof Error ? err.message : 'Error al guardar la comunidad')
        throw err
      }
    } else {
      const saved = await journal.commit({ id: recordId('community-save'), type: 'community', community: next })
      if (!saved.terrain) {
        setRealGardenDraft(current => {
          if (matchesCommunityLocation(current, next) || (current.province && !matchesCommunityLocation(current, communityRecord))) return current
          return { ...withCommunityLocation(current, next), reference: current.reference && current.reference !== communityRecord?.sector ? current.reference : next.sector ?? '' }
        })
      }
      setNotice('Comunidad guardada en este navegador.')
      if (communityEntry === 'create') goto('Inicio')
    }
  }

  async function saveGarden(next: RealGarden) {
    if (user) {
      try {
        let saved: RealGarden & { id: string }
        if (activeGardenId) {
          saved = await gardenApi.update(activeGardenId, next, activeCommunityId)
        } else {
          saved = await gardenApi.create(next, activeCommunityId)
        }
        if (saved?.id) setActiveGardenId(saved.id)
        setBackendGarden(saved)
        setRealGardenDraft(toGardenDraft(saved))
        if (activeCommunityId) {
          await loadGardenForCommunity(activeCommunityId)
        }
        setNotice('¡Huerto real guardado y sincronizado con la comunidad!')
        return saved
      } catch (err: unknown) {
        setNotice(err instanceof Error ? err.message : 'Error al guardar el huerto')
        throw err
      }
    } else {
      const saved = await journal.commit({ id: recordId('terrain-save'), type: 'terrain', terrain: next })
      setRealGardenDraft(toGardenDraft(saved.terrain))
      setNotice('Terreno guardado en este navegador.')
      return saved.terrain ?? undefined
    }
  }


  return { saveCommunity, saveGarden }
}
