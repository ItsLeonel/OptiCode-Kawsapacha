import type { GardenJournal } from './journal'
import type { ActivityDraft, ActivityType } from './activities'
import type { GardenPlant } from '../garden'
import { localDate } from '../plant-record'

/**
 * Nunca utilizar la bitácora IndexedDB de visitante como bitácora de una cuenta.
 * No se borran datos locales al iniciar sesión; permanecen disponibles en modo visitante.
 */
export const AUTHENTICATED_JOURNAL: GardenJournal = {
  version: 1, revision: 0, gardenId: '', community: null, terrain: null,
  plants: [], activities: [], appliedCommands: [],
}

export const BASIC_SERVER_ACTIVITY_TYPES: readonly ActivityType[] = ['watering', 'fertilizing', 'harvest']
export function isBasicServerActivity(type: ActivityType): boolean {
  return BASIC_SERVER_ACTIVITY_TYPES.includes(type)
}

/**
 * La API anterior a #43 solamente registra cuidados/cosechas básicos.
 * Rechazar cualquier dato que esta API perdería silenciosamente.
 */
export function validateBasicServerActivity(
  draft: ActivityDraft, plants: readonly GardenPlant[], authenticatedName: string, gardenId: string | null,
): string | null {
  if (!gardenId) return 'Selecciona un huerto sincronizado antes de registrar actividades.'
  if (!isBasicServerActivity(draft.type)) return 'La actividad requiere la API unificada #43. No se guardará en la bitácora de otra cuenta ni en este navegador.'
  if (draft.photo) return 'El servidor actual no admite fotos de cuidados ni cosechas. Conserva la fotografía y regístrala cuando esté disponible la API #43.'
  if (draft.date !== localDate()) return 'La API actual registra la fecha del servidor, no fechas anteriores. Utiliza la fecha de hoy o espera la Bitácora #43.'
  if (draft.responsible.trim() !== authenticatedName.trim()) return 'El servidor atribuye la actividad a la cuenta iniciada. No es posible registrar otro responsable con la API actual.'
  const target = draft.target
  if (target.kind !== 'plant') return 'Selecciona una planta activa del huerto sincronizado.'
  if (!plants.some(p => p.id === target.plantId && !p.archivedAt && p.plot === target.plot)) {
    return 'Selecciona una planta activa del huerto sincronizado.'
  }

  const details = draft.details
  const allowed = draft.type === 'harvest'
    ? ['quantity', 'unit', 'harvestMode']
    : draft.type === 'watering' ? ['quantity', 'unit', 'method'] : ['quantity', 'unit', 'material']
  if (Object.entries(details).some(([key, value]) => value !== undefined && value !== '' && !allowed.includes(key))) {
    return 'Este detalle requiere la Bitácora #43; no se guardará parcialmente en el servidor.'
  }
  if (draft.type === 'harvest') {
    if (details.harvestMode !== 'partial') return 'La API básica no admite cosechas completas ni liberación de parcelas. Espera la API de ciclo agrícola #43.'
    if (typeof details.quantity !== 'number' || !Number.isFinite(details.quantity) || details.quantity <= 0 ||
        !details.unit || !['L', 'kg', 'g', 'unidades'].includes(details.unit)) return 'Para guardar una cosecha en SQLite, indica cantidad y unidad reales.'
  } else if (details.quantity !== undefined && (!Number.isFinite(details.quantity) || details.quantity <= 0 || !details.unit)) {
    return 'Para conservar la cantidad del cuidado indica cantidad positiva y unidad.'
  }
  return null
}

export function basicServerNotes(draft: ActivityDraft): string {
  const lines = [draft.notes.trim()]
  if (draft.type === 'watering' && draft.details.method?.trim()) lines.push('Método: ' + draft.details.method.trim())
  if (draft.type === 'fertilizing' && draft.details.material?.trim()) lines.push('Material: ' + draft.details.material.trim())
  if (draft.type !== 'harvest' && draft.details.quantity !== undefined && draft.details.unit) {
    lines.push('Cantidad declarada: ' + draft.details.quantity + ' ' + draft.details.unit)
  }
  if (draft.type === 'harvest') lines.push('Modalidad declarada: cosecha parcial')
  return lines.filter(Boolean).join('\n')
}
