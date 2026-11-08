import { PLOT_COUNT, PLANT_STATES, type GardenPlant, type PlantState } from './garden'

export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && value <= localDate()
}
export function recordId(prefix: string) { return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}` }
export type PlantUpdate = { name: string; latin: string; plot: number; plantedOn: string; observations: string; state: PlantState; date: string; heightCm?: number; photo?: Blob; requestId?: string }
export function validatePlantUpdate(update: PlantUpdate, plant: GardenPlant, plants: readonly GardenPlant[]): string | null {
  if (update.name.trim().length < 2 || update.name.length > 100 || update.latin.length > 150) return 'Revisa el nombre común y el nombre científico.'
  if (!Number.isInteger(update.plot) || update.plot < 0 || update.plot >= PLOT_COUNT) return 'Selecciona un espacio válido.'
  if (!plant.archivedAt && plants.some(item => item.id !== plant.id && !item.archivedAt && item.plot === update.plot)) return 'Ese espacio está ocupado por otra planta.'
  if (update.plantedOn && !validDate(update.plantedOn)) return 'Indica una fecha de siembra válida, hasta hoy.'
  if (!validDate(update.date) || (update.plantedOn && update.date < update.plantedOn)) return 'La observación debe tener una fecha válida y posterior a la siembra.'
  if (!Object.hasOwn(PLANT_STATES, update.state)) return 'Selecciona el estado observado.'
  if (update.observations.length > 2000) return 'Usa hasta 2000 caracteres de observaciones.'
  if (update.heightCm !== undefined && (!Number.isFinite(update.heightCm) || update.heightCm < 0 || update.heightCm > 100000)) return 'Indica una altura válida en centímetros.'
  return null
}

/** Only explicit observations change the state; editing a date never grows a plant. */
export function updatePlantRecord(plant: GardenPlant, draft: PlantUpdate, photo?: { id?: string; url: string }): GardenPlant {
  const initial = plant.evidences ?? [{ id: `initial-${plant.id}`, date: plant.createdAt?.slice(0, 10) ?? plant.plantedOn ?? draft.date, notes: 'Fotografía de registro', photo: plant.photo, photoId: plant.photoId }]
  return { ...plant, name: draft.name.trim(), latin: draft.latin.trim(), plot: draft.plot, plantedOn: draft.plantedOn || undefined,
    observations: draft.observations.trim(), state: draft.state,
    ...(photo ? { photo: photo.url, photoId: photo.id } : {}),
    evidences: [...initial, { id: recordId('evidence'), date: draft.date, notes: draft.observations.trim() || 'Actualización de la ficha', state: draft.state, ...(draft.heightCm !== undefined ? { heightCm: draft.heightCm } : {}), ...(photo ? { photo: photo.url, photoId: photo.id } : {}) }],
  }
}
