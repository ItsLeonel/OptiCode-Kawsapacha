import type { Community } from '../../communities/communities'
import type { RealGarden } from '../../real-gardens/real-garden'
import { PLANT_STATES, type GardenPlant } from '../garden'
import { isGrowthStage } from '../growth-stages'
import { recordId, validDate, validatePlantUpdate, type PlantUpdate } from '../plant-record'
import { activityKey, validateActivity, type GardenActivity } from './activities'

export type GardenJournal = {
  version: 1; revision: number; gardenId: string; community: Community | null; terrain: RealGarden | null
  plants: GardenPlant[]; activities: GardenActivity[]; appliedCommands: string[]
}
export type JournalCommand = { id: string } & (
  | { type: 'community'; community: Community }
  | { type: 'terrain'; terrain: RealGarden }
  | { type: 'plant-add'; plant: GardenPlant; sowing?: GardenActivity }
  | { type: 'plant-update'; plantId: string; draft: Omit<PlantUpdate, 'photo'>; evidenceId: string; photoId?: string; retainedPhotoId?: string; at: string }
  | { type: 'plant-archive'; plantId: string; at: string }
  | { type: 'plant-restore'; plantId: string; at: string }
  | { type: 'activity'; activity: GardenActivity }
  | { type: 'activity-void'; activityId: string; reason: string; at: string }
)
export function emptyJournal(): GardenJournal { return { version: 1, revision: 0, gardenId: recordId('garden'), community: null, terrain: null, plants: [], activities: [], appliedCommands: [] } }
export function validateJournal(value: unknown): asserts value is GardenJournal {
  const data = value as Partial<GardenJournal> | null
  const invalid = () => { throw new Error('El formato de los datos guardados no es compatible. Se conservaron sin sobrescribirlos.') }
  if (!data || data.version !== 1 || !Number.isSafeInteger(data.revision) || data.revision! < 0 || typeof data.gardenId !== 'string' || !data.gardenId || !Array.isArray(data.plants) || !Array.isArray(data.activities) || !Array.isArray(data.appliedCommands)) return invalid()
  if (data.appliedCommands.some(id => typeof id !== 'string' || !id)) return invalid()
  const ids = new Set<string>()
  for (const plant of data.plants) {
    if (!plant || typeof plant.id !== 'string' || !plant.id || ids.has(plant.id) || typeof plant.name !== 'string' || typeof plant.latin !== 'string' || !Number.isInteger(plant.plot) || plant.plot < 0 || plant.plot >= 6 || (plant.photoId !== undefined && typeof plant.photoId !== 'string') || (plant.state !== undefined && !Object.hasOwn(PLANT_STATES, plant.state)) || (plant.growthStage !== undefined && !isGrowthStage(plant.growthStage)) || (plant.evidences !== undefined && !Array.isArray(plant.evidences))) return invalid()
    ids.add(plant.id)
    for (const evidence of plant.evidences ?? []) if (!evidence || typeof evidence.id !== 'string' || !validDate(evidence.date) || typeof evidence.notes !== 'string' || (evidence.growthStage !== undefined && !isGrowthStage(evidence.growthStage))) return invalid()
  }
  ids.clear()
  for (const activity of data.activities) {
    if (!activity || typeof activity.id !== 'string' || !activity.id || ids.has(activity.id) || !activity.target || !['garden', 'plant', 'plot'].includes(activity.target.kind) || !activity.details || typeof activity.responsible !== 'string' || typeof activity.notes !== 'string' || !Array.isArray(activity.photoIds) || activity.photoIds.some(id => typeof id !== 'string')) return invalid()
    ids.add(activity.id)
  }
  if (data.community && (typeof data.community.name !== 'string' || typeof data.community.responsible !== 'string')) return invalid()
  if (data.terrain && (!data.terrain.location || typeof data.terrain.name !== 'string' || !['ground', 'pots', 'vertical', 'hanging'].includes(data.terrain.kind) || !Number.isFinite(data.terrain.areaM2) || data.terrain.areaM2 < .01)) return invalid()
}

/** Pure agricultural rules. Storage and Phaser have no authority to infer growth. */
export function applyJournalCommand(current: GardenJournal, command: JournalCommand): GardenJournal {
  validateJournal(current)
  if (current.appliedCommands.includes(command.id)) return current
  let next = { ...current, plants: [...current.plants], activities: [...current.activities] }
  if (command.type === 'community') {
    next.community = command.community
    if (next.terrain) next.terrain = { ...next.terrain, communityName: command.community.name }
  } else if (command.type === 'terrain') {
    if (!next.community) throw new Error('Primero registra una comunidad para tu huerto.')
    next.terrain = { ...command.terrain, communityName: next.community.name }
  } else {
    if (!next.terrain || !next.community) throw new Error('Primero registra tu comunidad y tu terreno.')
    if (command.type === 'plant-add') {
      const plant = command.plant
      if (!plant.id || !plant.photoId || plant.name.trim().length < 2 || (plant.plantedOn !== undefined && !validDate(plant.plantedOn)) || !Number.isInteger(plant.plot) || plant.plot < 0 || plant.plot >= 6) throw new Error('Revisa la fotografía, identificación y espacio de la planta.')
      if (next.plants.some(item => item.id === plant.id) || projectPlants(next).some(item => !item.archivedAt && item.plot === plant.plot)) throw new Error('Ese espacio ya está ocupado. Tu fotografía no se ha perdido.')
      next.plants.push({ ...plant, photo: '' })
      if (command.sowing) next = addActivity(next, command.sowing)
    } else if (command.type === 'activity') next = addActivity(next, command.activity)
    else if (command.type === 'activity-void') {
      const activity = next.activities.find(item => item.id === command.activityId)
      if (!activity) throw new Error('No se encontró la actividad.')
      if (activity.voidedAt) return current
      if (command.reason.trim().length < 5) throw new Error('Indica el motivo de la anulación (al menos 5 caracteres).')
      // Keep the original event and evidence. The visible state is rebuilt from non-void events.
      next.activities = next.activities.map(item => item.id === activity.id ? { ...item, voidedAt: command.at, voidReason: command.reason.trim() } : item)
    } else {
      const index = next.plants.findIndex(plant => plant.id === command.plantId)
      if (index < 0) throw new Error('No se encontró la planta registrada.')
      const plant = next.plants[index]
      const visible = projectPlants(next).find(item => item.id === plant.id)!
      if (command.type === 'plant-update') {
        const invalid = validatePlantUpdate(command.draft, visible, projectPlants(next), Boolean(command.photoId))
        if (invalid) throw new Error(invalid)
        const evidences = plant.evidences ?? [{ id: `initial-${plant.id}`, date: plant.createdAt?.slice(0, 10) ?? command.draft.date, notes: 'Fotografía de registro', photoId: plant.photoId }]
        next.plants[index] = { ...plant, name: command.draft.name.trim(), latin: command.draft.latin.trim(), plot: command.draft.plot, plantedOn: command.draft.plantedOn || undefined,
          observations: command.draft.observations.trim(), state: command.draft.state, ...(command.draft.growthStage !== undefined ? { growthStage: command.draft.growthStage } : {}), updatedAt: command.at, photoId: command.photoId ?? command.retainedPhotoId ?? visible.photoId, photo: '',
          evidences: [...evidences, { id: command.evidenceId, date: command.draft.date, notes: command.draft.observations.trim() || 'Actualización de ficha', state: command.draft.state, ...(command.draft.growthStage !== undefined ? { growthStage: command.draft.growthStage } : {}), ...(command.draft.heightCm !== undefined ? { heightCm: command.draft.heightCm } : {}), ...(command.photoId ? { photoId: command.photoId } : {}) }],
        }
      } else if (command.type === 'plant-archive') next.plants[index] = { ...plant, plot: visible.plot, state: visible.state, photoId: visible.photoId, plantedOn: visible.plantedOn, updatedAt: command.at, archivedAt: command.at }
      else if (command.type === 'plant-restore') {
        if (projectPlants(next).some(item => !item.archivedAt && item.id !== plant.id && item.plot === visible.plot)) throw new Error('El espacio está ocupado. Actualiza la ficha archivada para elegir uno libre.')
        next.plants[index] = { ...plant, plot: visible.plot, state: visible.state, photoId: visible.photoId, plantedOn: visible.plantedOn, updatedAt: command.at, archivedAt: undefined }
      }
    }
  }
  const occupied = projectPlants(next).filter(plant => !plant.archivedAt).map(plant => plant.plot)
  if (new Set(occupied).size !== occupied.length) throw new Error('Ese cambio ocuparía un espacio que ya tiene otra planta. Libera o cambia su ubicación primero.')
  return { ...next, revision: current.revision + 1, appliedCommands: [...current.appliedCommands, command.id] }
}

function addActivity(journal: GardenJournal, activity: GardenActivity): GardenJournal {
  if (activity.gardenId !== journal.gardenId || activity.validation !== 'local-v1') throw new Error('La actividad no corresponde a este huerto.')
  const invalid = validateActivity(activity, projectPlants(journal))
  if (invalid) throw new Error(invalid)
  if (journal.activities.some(item => item.id === activity.id || activityKey(item) === activityKey(activity))) return journal
  return { ...journal, activities: [...journal.activities, { ...activity, photos: undefined, responsible: activity.responsible.trim(), notes: activity.notes.trim() }] }
}

/** Projection of documented agricultural effects; original records remain recoverable. */
export function projectPlants(journal: GardenJournal): GardenPlant[] {
  return journal.plants.map(record => {
    let plant = { ...record, evidences: [...(record.evidences ?? [])] }
    for (const activity of [...journal.activities].filter(item => !item.voidedAt && item.target.kind === 'plant' && item.target.plantId === plant.id).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))) {
      const details = activity.details
      const currentEffect = !record.updatedAt || activity.createdAt >= record.updatedAt
      if (activity.type === 'sowing' && !plant.plantedOn) plant = { ...plant, plantedOn: activity.date }
      if (activity.type === 'observation') {
        if (details.state && currentEffect) plant.state = details.state
        if (details.growthStage && currentEffect) plant.growthStage = details.growthStage
        if (activity.photoIds[0] && currentEffect) { plant.photoId = activity.photoIds[0]; plant.photo = activity.photos?.[0] ?? '' }
        plant.evidences.push({ id: activity.id, date: activity.date, notes: activity.notes, ...(details.state ? { state: details.state } : {}), ...(details.growthStage ? { growthStage: details.growthStage } : {}), ...(details.heightCm !== undefined ? { heightCm: details.heightCm } : {}), ...(activity.photoIds[0] ? { photoId: activity.photoIds[0], photo: activity.photos?.[0] } : {}) })
      }
      if (activity.type === 'replanting' && details.destinationPlot !== undefined && currentEffect) plant.plot = details.destinationPlot
      if (activity.type === 'harvest' && details.harvestMode === 'complete' && currentEffect) { plant.state = 'harvested'; plant.growthStage = 'harvested'; if (details.releasePlot) plant.archivedAt = activity.createdAt }
    }
    return plant
  })
}
