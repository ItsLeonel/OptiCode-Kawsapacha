import type { Dispatch, SetStateAction } from 'react'
import { gardenApi, plantApi, activityApi, resolveMediaUrl } from '../shared/api/client'
import type { RealGarden, RealGardenDraft } from '../features/real-gardens/real-garden'
import { toGardenDraft } from '../features/real-gardens/real-garden'
import type { GardenPlant } from '../features/my-garden/garden'
import type { GardenActivity } from '../features/my-garden/journal/activities'
import { isGrowthStage } from '../features/my-garden/growth-stages'
import { mapBackendActivity } from '../features/my-garden/journal/map-backend-activity'

/** Coordinación de carga de datos persistidos; no controla la vista ni el renderizador Phaser. */
interface BackendGardenLoaderContext {
  setActiveGardenId: Dispatch<SetStateAction<string | null>>
  setBackendGarden: Dispatch<SetStateAction<RealGarden | null>>
  setRealGardenDraft: Dispatch<SetStateAction<RealGardenDraft>>
  setBackendPlants: Dispatch<SetStateAction<GardenPlant[]>>
  setBackendActivities: Dispatch<SetStateAction<GardenActivity[]>>
  reloadServerRewards: () => Promise<void>
}

export function createBackendGardenLoader({
  setActiveGardenId, setBackendGarden, setRealGardenDraft,
  setBackendPlants, setBackendActivities, reloadServerRewards,
}: BackendGardenLoaderContext) {
  async function reloadBackendActivities(gId: string) {
    try {
      // Recuperar también las anuladas: conservan enlaces a cuidados/cosechas
      // y evitan que la Bitácora vuelva a mostrarlas como registros legados activos.
      const list = await activityApi.list(gId, { includeVoided: true })
      if (list && Array.isArray(list)) {
        setBackendActivities(list.map(mapBackendActivity))
      }
      void reloadServerRewards()
    } catch (err) {
      console.error('Error cargando actividades del servidor:', err)
    }
  }
  
  async function loadGardenForCommunity(cId: string) {
    try {
      const gardensList = await gardenApi.list(cId)
      if (gardensList && gardensList.length > 0) {
        const g = gardensList[0] as unknown as RealGarden & { id: string }
        setActiveGardenId(g.id)
        setBackendGarden(g)
        setRealGardenDraft(toGardenDraft(g))
  
        const apiPlants = await plantApi.listByGarden(g.id)
        if (apiPlants && apiPlants.length > 0) {
          const activeList = apiPlants.filter(p => p.lifecycleStatus !== 'REMOVED')
          setBackendPlants(
            activeList.map(p => ({
              id: p.id,
              name: p.customName || p.species?.name || p.speciesId,
              latin: p.species?.latinName || '',
              photo: resolveMediaUrl(p.photoUrl),
              date: new Date(p.createdAt ?? p.plantingDate).toLocaleDateString('es-EC'),
              plantedOn: p.plantingDate.slice(0, 10),
              plot: p.plotIndex ?? -1,
              createdAt: (p as any).createdAt || new Date(p.plantingDate).toISOString(),
              state: (p as any).observedState || (p.lifecycleStatus === 'READY_TO_HARVEST' ? 'mature' : 'growing'),
              growthStage: isGrowthStage(p.growthStage) ? p.growthStage : undefined,
              observations: p.notes || '',
              archivedAt: p.archivedAt ? new Date(p.archivedAt).toISOString() : (p.lifecycleStatus === 'ARCHIVED' ? new Date().toISOString() : undefined),
              reviewStatus: p.reviewStatus ?? 'APPROVED', // Registro válido; el MSP puede auditar la siembra después
            }))
          )
        } else {
          setBackendPlants([])
        }
        await reloadBackendActivities(g.id)
      } else {
        setActiveGardenId(null)
        setBackendGarden(null)
        setRealGardenDraft(toGardenDraft(null))
        setBackendPlants([])
        setBackendActivities([])
      }
    } catch {
      setActiveGardenId(null)
      setBackendGarden(null)
      setRealGardenDraft(toGardenDraft(null))
      setBackendPlants([])
      setBackendActivities([])
    }
  }

  return { reloadBackendActivities, loadGardenForCommunity }
}
