import type { Dispatch, SetStateAction } from 'react'
import type { activityApi as ActivityApiSingleton, UserSession } from '../../../shared/api/client'
import type { Community } from '../../../shared/contracts/community'
import type { RealGarden } from '../../../shared/contracts/real-garden'
import type { GardenPlant } from '../garden'
import { recordId } from '../plant-record'
import { photoExtension } from '../../../shared/utils/photo-extension'
import { useGardenJournal } from './useGardenJournal'
type ReturnTypeOfGardenJournal = ReturnType<typeof useGardenJournal>
import type { ActivityDraft, ActivityType, GardenActivity } from './activities'

type ActivityForm = {plantId?: string; plot?: number | null; type?: ActivityType} | null
type ActivityFeedback = {id: string; type: ActivityType; plot: number | null} | null

type ActivityActionsContext = {
  activityApi: typeof ActivityApiSingleton
  user: UserSession | null
  activeGardenId: string | null
  backendPlants: GardenPlant[]
  realGarden: RealGarden | null
  communityRecord: Community | null
  plants: GardenPlant[]
  backendCommunity: Community | null
  activeCommunityId: string | null
  selectedPlot: number | null
  setDetailId: Dispatch<SetStateAction<string | null>>
  setActivityForm: Dispatch<SetStateAction<ActivityForm>>
  goto: (screen: 'Mi terreno') => void
  setNotice: Dispatch<SetStateAction<string>>
  reloadBackendActivities: (gardenId: string) => Promise<void>
  loadGardenForCommunity: (communityId: string) => Promise<void>
  reloadServerRewards: () => Promise<void>
  loadPendingInvitations: () => Promise<void>
  setServerActivityRevision: Dispatch<SetStateAction<number>>
  screen: string
  setFeedback: Dispatch<SetStateAction<ActivityFeedback>>
  journal: ReturnTypeOfGardenJournal
}

/** Orquesta registros en servidor y modo visitante; no administra navegación global. */
export function createActivityActions({activityApi, user, activeGardenId, backendPlants, realGarden, communityRecord, plants, backendCommunity, activeCommunityId, selectedPlot, setDetailId, setActivityForm, goto, setNotice, reloadBackendActivities, loadGardenForCommunity, reloadServerRewards, loadPendingInvitations, setServerActivityRevision, screen, setFeedback, journal}: ActivityActionsContext) {
  function openActivity(plant?: GardenPlant, type?: ActivityType) {
    if (user && (activeGardenId || backendPlants.length > 0)) {
      setDetailId(null)
      setActivityForm({ plantId: plant?.id, plot: plant?.plot ?? selectedPlot, type })
      return
    }
    if (!realGarden || !communityRecord) {
      const hasPlants = plants.length > 0
      const hasCommunity = Boolean(backendCommunity || activeCommunityId)
      if (!hasPlants && !hasCommunity) {
        goto('Mi terreno')
        return
      }
    }
    setDetailId(null)
    setActivityForm({ plantId: plant?.id, plot: plant?.plot ?? selectedPlot, type })
  }

  async function saveActivity(draft: ActivityDraft) {
    if (user) {
      if (!activeGardenId) {
        throw new Error('Selecciona un huerto sincronizado antes de registrar la actividad. No se guardó en IndexedDB.')
      }

      if (activeGardenId) {
        const formData = new FormData()
        formData.append('type', draft.type)
        formData.append('performedDate', draft.date)
        formData.append('targetKind', draft.target.kind)
        if (draft.target.kind === 'plant') {
          formData.append('plantId', draft.target.plantId)
          formData.append('plotIndex', String(draft.target.plot))
        } else if (draft.target.kind === 'plot') {
          formData.append('plotIndex', String(draft.target.plot))
        }
        formData.append('notes', draft.notes || '')
        formData.append('details', JSON.stringify(draft.details || {}))
        formData.append('clientActivityId', draft.id)
        if (draft.photo) {
          formData.append('photo', draft.photo, `activity.${photoExtension(draft.photo)}`)
        }
        const created = await activityApi.create(activeGardenId, formData)
        const earned = Number(created.reward?.pointsAwarded ?? 0)
        setNotice(earned > 0
          ? `✅ Actividad registrada. +${earned} Semillas de vida acreditadas.`
          : '✅ Actividad guardada en Bitácora. El MSP puede auditarla posteriormente.')
        await reloadBackendActivities(activeGardenId)

        if (activeCommunityId) {
          await loadGardenForCommunity(activeCommunityId)
        }
        await Promise.all([reloadServerRewards(), loadPendingInvitations()])
      }

      setActivityForm(null)
      setServerActivityRevision(r => r + 1)

      if (screen === 'Inicio') {
        setFeedback({ id: draft.id, type: draft.type, plot: draft.details.destinationPlot ?? (draft.target.kind === 'garden' ? null : draft.target.plot) })
      }
      return
    }

    const photoId = draft.photo ? recordId('photo') : undefined
    const activity: GardenActivity = {
      id: draft.id,
      gardenId: journal.data.gardenId,
      type: draft.type,
      date: draft.date,
      responsible: draft.responsible || 'Comunidad',
      target: draft.target,
      notes: draft.notes,
      details: draft.details,
      createdAt: new Date().toISOString(),
      validation: 'local-v1',
      photoIds: photoId ? [photoId] : [],
    }
    const saved = await journal.commit({ id: draft.id, type: 'activity', activity }, draft.photo && photoId ? [{ id: photoId, blob: draft.photo }] : [])
    const actual = saved.activities.find(item => item.id === draft.id)
    setActivityForm(null)
    if (!actual) {
      setNotice('Esta actividad ya estaba guardada. El registro permanece solo en este navegador.')
      return
    }
    setNotice('Actividad guardada en este navegador.')
    if (screen === 'Inicio') {
      setFeedback({ id: actual.id, type: actual.type, plot: actual.details.destinationPlot ?? (actual.target.kind === 'garden' ? null : actual.target.plot) })
    }
  }

  async function voidActivity(id: string, reason: string) {
    if (user) {
      if (activeGardenId) {
        await activityApi.void(activeGardenId, id, reason)
        await reloadBackendActivities(activeGardenId)
        setServerActivityRevision(r => r + 1)
      }
      setNotice('Actividad anulada en el servidor; se conserva el historial.')
      return
    }
    await journal.commit({ id: recordId('activity-void'), type: 'activity-void', activityId: id, reason, at: new Date().toISOString() })
    setNotice('Actividad anulada en este navegador; se conserva el historial.')
  }


  return { openActivity, saveActivity, voidActivity }
}
