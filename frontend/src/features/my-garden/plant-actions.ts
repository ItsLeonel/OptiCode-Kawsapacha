import type { Dispatch, SetStateAction } from 'react'
import type { plantApi as PlantApiSingleton, resolveMediaUrl as ResolveMediaUrl, UserSession } from '../../shared/api/client'
import type { Community } from '../../shared/contracts/community'
import type { RealGarden } from '../../shared/contracts/real-garden'
import { PLOT_COUNT, type GardenPlant } from './garden'
import { PLANT_SPECIES as SPECIES, type PlantRegistration, type PlantRegistrationResult } from './plant-species'
import type { PlantRegistrationDraft } from './plant-registration-draft'
import { localDate, recordId, validatePlantUpdate, validDate, type PlantUpdate } from './plant-record'
import { isGrowthStage } from './growth-stages'
import type { GardenActivity } from './journal/activities'
import { useGardenJournal } from './journal/useGardenJournal'
import { photoExtension } from '../../shared/utils/photo-extension'

type PlantActionsContext = {
  plantApi: typeof PlantApiSingleton
  resolveMediaUrl: typeof ResolveMediaUrl
  user: UserSession | null
  activeGardenId: string | null
  activeCommunityId: string | null
  activePlants: GardenPlant[]
  plants: GardenPlant[]
  communityRecord: Community | null
  realGarden: RealGarden | null
  journal: ReturnType<typeof useGardenJournal>
  editingPlant: GardenPlant | undefined
  detail: GardenPlant | null
  currentCommunityRole: 'RESPONSABLE' | 'PARTICIPANTE' | null
  setNotice: Dispatch<SetStateAction<string>>
  setBackendPlants: Dispatch<SetStateAction<GardenPlant[]>>
  setRegistration: Dispatch<SetStateAction<PlantRegistrationDraft | null>>
  setDetailId: Dispatch<SetStateAction<string | null>>
  setSelectedPlot: Dispatch<SetStateAction<number | null>>
  setServerActivityRevision: Dispatch<SetStateAction<number>>
  setEditingId: Dispatch<SetStateAction<string | null>>
  setPendingRegistration: Dispatch<SetStateAction<PlantRegistrationDraft | null>>
  reloadBackendActivities: (gardenId: string) => Promise<void>
  loadGardenForCommunity: (communityId: string) => Promise<void>
  goto: (screen: 'Inicio') => void
}

/** Comandos de plantas: misma semántica para sesión SQLite y visitante IndexedDB. */
export function createPlantActions({plantApi, resolveMediaUrl, user, activeGardenId, activeCommunityId, activePlants, plants, communityRecord, realGarden, journal, editingPlant, detail, currentCommunityRole, setNotice, setBackendPlants, setRegistration, setDetailId, setSelectedPlot, setServerActivityRevision, setEditingId, setPendingRegistration, reloadBackendActivities, loadGardenForCommunity, goto}: PlantActionsContext) {
  async function addPlant(input: PlantRegistration): Promise<PlantRegistrationResult> {
    if (user) {
      if (!activeGardenId) {
        return { ok: false, error: 'Primero vincula tu comunidad y registra tu huerto real.' }
      }
      if (!Number.isInteger(input.plot) || input.plot < 0 || input.plot >= PLOT_COUNT) {
        return { ok: false, error: 'Selecciona un espacio de cultivo válido.' }
      }
      if (activePlants.some(plant => plant.plot === input.plot)) {
        return { ok: false, error: 'Ese espacio ya tiene una planta. Elige otro espacio disponible.' }
      }

      try {
        const ext = photoExtension(input.photo)
        const file = new File([input.photo], `${input.species.name.toLowerCase().replace(/\s+/g, '-')}.${ext}`, {
          type: input.photo.type || 'image/jpeg',
        })
        const apiPlant = await plantApi.register(activeGardenId, {
          file,
          speciesId: input.species.id ?? input.species.name,
          plotIndex: input.plot,
          customName: input.species.name,
          notes: input.plantedOn ? `Sembrada el ${input.plantedOn}` : 'Registrada con cámara Kawsapacha',
          plantedOn: input.plantedOn || undefined,
          growthStage: input.growthStage || undefined,
        })

        const record: GardenPlant = {
          id: apiPlant.id,
          name: apiPlant.species?.name || input.species.name,
          latin: apiPlant.species?.latinName || input.species.latin,
          photo: resolveMediaUrl(apiPlant.photoUrl),
          date: new Date(apiPlant.plantingDate).toLocaleDateString('es-EC'),
          plot: apiPlant.plotIndex ?? 0,
          plantedOn: input.plantedOn,
          createdAt: (apiPlant as any).createdAt || new Date(apiPlant.plantingDate).toISOString(),
          state: 'observed',
          growthStage: isGrowthStage(apiPlant.growthStage) ? apiPlant.growthStage : input.growthStage,
          reviewStatus: apiPlant.reviewStatus || 'APPROVED',
        }
        setBackendPlants(existing => [...existing, record])
        setRegistration(null)
        setDetailId(record.id)
        setSelectedPlot(null)
        setServerActivityRevision(r => r + 1)
        if (activeGardenId) {
          void reloadBackendActivities(activeGardenId)
        }
        setNotice('🌱 Siembra guardada. Puedes empezar a cuidarla; el MSP revisará la evidencia posteriormente.')
        goto('Inicio')
        return { ok: true }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al registrar la planta en el servidor.'
        return { ok: false, error: msg }
      }
    }

    // Modo visitante (sin sesión)
    if (!communityRecord || !realGarden) return { ok: false, error: 'Primero registra tu comunidad y tu terreno.' }
    if (!Number.isInteger(input.plot) || input.plot < 0 || input.plot >= PLOT_COUNT || activePlants.some(plant => plant.plot === input.plot)) {
      return { ok: false, error: 'Selecciona un espacio disponible. No se sustituirá ninguna planta.' }
    }
    if (input.plantedOn && !validDate(input.plantedOn)) return { ok: false, error: 'Indica una fecha de siembra válida, hasta hoy.' }
    if (input.recordSowing && (!input.plantedOn || !input.responsible?.trim())) return { ok: false, error: 'Indica la fecha de siembra y su responsable.' }
    const id = input.requestId ? 'plant-' + input.requestId : recordId('plant'), photoId = recordId('photo'), now = new Date().toISOString()
    const plant: GardenPlant = {
      id,
      name: input.species.name,
      latin: input.species.latin,
      photo: '',
      photoId,
      date: new Date().toLocaleDateString('es-EC'),
      plot: input.plot,
      createdAt: now,
      state: 'not-documented',
      ...(input.growthStage ? { growthStage: input.growthStage } : {}),
      ...(input.visualProfile ? { visualProfile: input.visualProfile } : {}),
      ...(input.plantedOn ? { plantedOn: input.plantedOn } : {}),
      evidences: [{ id: 'initial-' + id, date: localDate(), notes: 'Fotografía de registro', photoId, ...(input.growthStage ? { growthStage: input.growthStage } : {}), ...(input.visualProfile ? { visualProfile: input.visualProfile } : {}) }],
    }
    const sowing: GardenActivity | undefined = input.recordSowing
      ? {
          id: 'sowing-' + id,
          gardenId: journal.data.gardenId,
          type: 'sowing',
          date: input.plantedOn!,
          responsible: input.responsible!.trim(),
          target: { kind: 'plant', plantId: id, plot: input.plot },
          notes: 'Siembra documentada junto con la ficha y su fotografía.',
          photoIds: [photoId],
          details: {},
          createdAt: now,
          validation: 'local-v1',
        }
      : undefined
    try {
      await journal.commit({ id: input.requestId ?? id, type: 'plant-add', plant, sowing }, [{ id: photoId, blob: input.photo }])
      goto('Inicio')
      setDetailId(id)
      setSelectedPlot(null)
      setNotice('Planta y fotografía guardadas en este navegador.')
      return { ok: true }
    } catch (cause) {
      return { ok: false, error: cause instanceof Error ? cause.message : 'No se pudo guardar la planta. Tu fotografía sigue disponible.' }
    }
  }

  function selectPlant(plant: GardenPlant) {
    setDetailId(plant.id)
  }

  function registerInPlot(plot?: number, speciesName: string = SPECIES[0].name, message?: string) {
    if (plot !== undefined) {
      const occupant = activePlants.find(item => item.plot === plot)
      if (occupant) {
        const isPending = occupant.reviewStatus === 'PENDING' || occupant.reviewStatus === 'NEEDS_CHANGES'
        setNotice(
          isPending
            ? `El Espacio ${plot + 1} ya está sembrado con «${occupant.name}». Puedes cuidarla, pero no sembrar otra en el mismo espacio.`
            : `El Espacio ${plot + 1} ya está ocupado por «${occupant.name}».`
        )
        setDetailId(occupant.id)
        return
      }
    }
    setSelectedPlot(plot ?? null)
    setDetailId(null)
    setEditingId(null)
    setPendingRegistration(null)
    setRegistration({
      plot: plot ?? null,
      species: speciesName,
      notice: message,
      photo: null,
      plantedOn: '',
      responsible: communityRecord?.responsible ?? '',
    })
  }

  async function updatePlant(draft: PlantUpdate) {
    if (!editingPlant) throw new Error('No se encontró la ficha de la planta.')
    const invalid = validatePlantUpdate(draft, editingPlant, plants)
    if (invalid) throw new Error(invalid)

    if (user) {
      const formData = new FormData()
      formData.append('name', draft.name)
      formData.append('customName', draft.name)
      formData.append('latin', draft.latin)
      formData.append('plotIndex', String(draft.plot))
      if (draft.plantedOn) formData.append('plantedOn', draft.plantedOn)
      if (draft.state) formData.append('state', draft.state)
      if (draft.growthStage) formData.append('growthStage', draft.growthStage)
      if (draft.observations) formData.append('observations', draft.observations)
      if (draft.heightCm !== undefined) formData.append('heightCm', String(draft.heightCm))
      if (draft.photo) formData.append('picture', draft.photo, `plant.${photoExtension(draft.photo)}`)

      const updated = await plantApi.update(editingPlant.id, formData)

      setBackendPlants(prev =>
        prev.map(p => {
          if (p.id === editingPlant.id) {
            const fullPhoto = resolveMediaUrl(updated.photoUrl || p.photo)
            return {
              ...p,
              name: updated.customName || p.name,
              latin: updated.species?.latinName || p.latin,
              plot: updated.plotIndex ?? p.plot,
              plantedOn: updated.plantingDate ? updated.plantingDate.slice(0, 10) : p.plantedOn,
              state: (updated as any).observedState || draft.state || p.state,
              growthStage: isGrowthStage((updated as any).growthStage) ? (updated as any).growthStage : (draft.growthStage ?? p.growthStage),
              observations: updated.notes || draft.observations || p.observations,
              photo: fullPhoto,
            }
          }
          return p
        })
      )

      setServerActivityRevision(r => r + 1)
      if (activeGardenId) {
        void reloadBackendActivities(activeGardenId)
      }
      setEditingId(null)
      setDetailId(editingPlant.id)
      setNotice('Observación, estado y evidencias guardadas en el servidor.')
      return
    }

    const photoId = draft.photo ? recordId('photo') : undefined
    const { photo, ...fields } = draft
    await journal.commit(
      {
        id: draft.requestId ?? recordId('plant-update'),
        type: 'plant-update',
        plantId: editingPlant.id,
        draft: fields,
        evidenceId: 'evidence-' + (draft.requestId ?? recordId('update')),
        photoId,
        retainedPhotoId: editingPlant.photoId,
        at: new Date().toISOString(),
      },
      photo && photoId ? [{ id: photoId, blob: photo }] : []
    )

    setEditingId(null)
    setDetailId(editingPlant.id)
    setNotice('Observación, estado y evidencias guardadas.')
  }

  async function archivePlant() {
    if (!detail) return
    if (user) {
      if (currentCommunityRole && currentCommunityRole !== 'RESPONSABLE') {
        setNotice('Solo las personas con rol Responsable pueden archivar plantas y liberar parcelas.')
        return
      }
      await plantApi.archive(detail.id)
      setBackendPlants(prev =>
        prev.map(p =>
          p.id === detail.id
            ? { ...p, plot: -1, archivedAt: new Date().toISOString() }
            : p
        )
      )
      setServerActivityRevision(r => r + 1)
      setDetailId(null)
      setNotice('📦 Planta archivada en el servidor. La parcela ha quedado libre para un nuevo cultivo.')
      return
    }
    await journal.commit({ id: recordId('archive'), type: 'plant-archive', plantId: detail.id, at: new Date().toISOString() })
    setDetailId(null)
    setNotice('📦 Planta archivada. La parcela ha quedado libre para un nuevo cultivo.')
  }

  async function restorePlant() {
    if (!detail) return null
    if (user) return 'La restauración en servidor requiere una solicitud autorizada.'
    try {
      await journal.commit({ id: recordId('restore'), type: 'plant-restore', plantId: detail.id, at: new Date().toISOString() })
      return null
    } catch (cause) {
      return cause instanceof Error ? cause.message : 'No se pudo restaurar la ficha.'
    }
  }


  function handlePlantHarvested(_plantId: string) {
    setDetailId(null)
    setNotice('🌾 ¡Cosecha recolectada e ingresada al almacén! La planta permanece sembrada y ha iniciado un nuevo ciclo de rebrote.')
    if (activeGardenId) {
      loadGardenForCommunity(activeCommunityId || '')
    }
  }

  function handlePlantRemoved(plantId: string) {
    setBackendPlants(prev => prev.filter(p => p.id !== plantId))
    setDetailId(null)
    setNotice('🗑️ Planta desarraigada. La parcela ha quedado libre para un nuevo cultivo.')
  }


  return { addPlant, selectPlant, registerInPlot, updatePlant, archivePlant, restorePlant,
    handlePlantHarvested, handlePlantRemoved }
}
