import { ACTIVITY_TYPES, type ActivityDraft, type GardenActivity, type ActivityType } from './activities'

export const POSTHARVEST_STEPS = ['cleaning', 'drying', 'packaging', 'storage'] as const
export type PostharvestStep = typeof POSTHARVEST_STEPS[number]
export const isPostharvestStep = (value: ActivityType): value is PostharvestStep => (POSTHARVEST_STEPS as readonly string[]).includes(value)

export type HarvestLot = {
  id: string; date: string; label: string; responsible: string; plantId: string | null
}

/** En este prototipo los lotes proceden únicamente de cosechas documentadas en la Bitácora. */
export function listHarvestLots(activities: readonly GardenActivity[], gardenId: string): HarvestLot[] {
  return activities.filter(a => a.gardenId === gardenId && a.type === 'harvest' && !a.voidedAt)
    .map(a => ({
      id: a.id,
      date: a.date,
      label: a.target.kind === 'plant' ? `Cosecha · Espacio ${a.target.plot + 1} · ${a.date}` : `Cosecha del huerto · ${a.date}`,
      responsible: a.responsible,
      plantId: a.target.kind === 'plant' ? a.target.plantId : null,
    }))
    .sort((a,b) => b.date.localeCompare(a.date))
}

/**
 * No infiere procesos realizados. Cada avance del lote exige su propio registro.
 * Al anular una etapa previa se bloquea registrar nuevas etapas hasta corregir el historial.
 * Esto NO certifica inocuidad, aptitud para consumo o aprobación del MSP.
 */
export function validatePostharvestStep(
  activity: Pick<GardenActivity, 'gardenId' | 'type' | 'date' | 'details'>,
  history: readonly GardenActivity[],
): string | null {
  if (!isPostharvestStep(activity.type)) return null
  const lotId = activity.details.sourceHarvestId
  if (!lotId) return 'Selecciona la cosecha real de origen del lote.'
  const harvest = history.find(a => a.id === lotId && a.gardenId === activity.gardenId && a.type === 'harvest' && !a.voidedAt)
  if (!harvest) return 'La cosecha de origen no está registrada o fue anulada.'
  if (activity.date < harvest.date) return 'La poscosecha no puede ocurrir antes de la cosecha documentada.'
  const index = POSTHARVEST_STEPS.indexOf(activity.type)
  const earlier = history.filter(a => a.gardenId === activity.gardenId && a.details.sourceHarvestId === lotId
    && isPostharvestStep(a.type) && !a.voidedAt)
  for (let i=0; i<index; i++) {
    const precedent = earlier.find(a => a.type === POSTHARVEST_STEPS[i])
    if (!precedent) return `Registra primero: ${ACTIVITY_TYPES[POSTHARVEST_STEPS[i]]}.`
    if (precedent.date > activity.date) return 'No se puede registrar una etapa anterior a la fecha de la etapa previa.'
  }
  if (earlier.some(a => a.type === activity.type && a.id !== (activity as {id?: string}).id)) {
    return 'Esa etapa ya está documentada para el lote. Anula el registro anterior si necesitas corregirlo.'
  }
  if (activity.type === 'packaging' && activity.details.packagedOn !== activity.date) return 'La fecha de empaquetado debe coincidir con la fecha de la actividad.'
  return null
}

export function statusForHarvestLot(lotId: string, history: readonly GardenActivity[]) {
  const active = history.filter(a => a.details.sourceHarvestId === lotId && isPostharvestStep(a.type) && !a.voidedAt)
  return POSTHARVEST_STEPS.find(step => !active.some(a => a.type === step)) ?? null
}

// Tipado de la función permite comprobar borradores antes de persistir fotografías.
export function validatePostharvestDraft(draft: ActivityDraft, gardenId: string, history: readonly GardenActivity[]): string | null {
  return validatePostharvestStep({ ...draft, gardenId }, history)
}
