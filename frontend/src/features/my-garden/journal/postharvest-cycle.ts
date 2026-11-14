import type { GardenActivity, ActivityDetails } from './activities'

/** Secuencia documental poscosecha (MSP 2017). No simula que la labor ocurrió. */
export const POSTHARVEST_STEPS = {
  cleaning: 'Limpieza de la cosecha',
  'drying-start': 'Inicio del secado a la sombra',
  'drying-end': 'Fin del secado documentado',
  packaging: 'Empaquetado y etiquetado',
  storage: 'Almacenaje de la cosecha',
} as const
export type PostHarvestStep = keyof typeof POSTHARVEST_STEPS
export const POSTHARVEST_ORDER = Object.keys(POSTHARVEST_STEPS) as PostHarvestStep[]

export const SOWING_METHODS = {
  seeds: 'Semillas', stakes: 'Estacas', cuttings: 'Esquejes', seedlings: 'Plántulas',
} as const
export type SowingMethod = keyof typeof SOWING_METHODS

export const HARVEST_PARTS = {
  leaves: 'Hojas', flowers: 'Flores', fruits: 'Frutos', seeds: 'Semillas', roots: 'Raíces', other: 'Otra parte documentada',
} as const
export type HarvestPart = keyof typeof HARVEST_PARTS

const dateValue = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN
  const date = new Date(value + 'T00:00:00Z')
  return date.toISOString().slice(0, 10) === value ? date.getTime() : NaN
}

export function completedPostharvestSteps(events: readonly GardenActivity[], harvestId: string) {
  return POSTHARVEST_ORDER.filter(step => events.some(event =>
    !event.voidedAt && event.type === 'postharvest' && event.details.sourceHarvestId === harvestId && event.details.postharvestStep === step,
  ))
}

export function nextPostharvestStep(events: readonly GardenActivity[], harvestId: string): PostHarvestStep | null {
  const completed = completedPostharvestSteps(events, harvestId)
  return POSTHARVEST_ORDER[completed.length] ?? null
}

export function dryingElapsedDays(events: readonly GardenActivity[], harvestId: string, endDate: string): number | null {
  const start = events.find(event => !event.voidedAt && event.type === 'postharvest'
    && event.details.sourceHarvestId === harvestId && event.details.postharvestStep === 'drying-start')
  if (!start) return null
  const a = dateValue(start.date), b = dateValue(endDate)
  return Number.isFinite(a) && Number.isFinite(b) ? (b - a) / 86_400_000 : null
}

/**
 * Validación de trazabilidad contra cosecha EXISTENTE. Nunca genera lotes,
 * existencias, fecha de caducidad ni premios en backend.
 */
export function validatePostharvest(
  activity: Pick<GardenActivity, 'date' | 'target' | 'details' | 'id'>,
  events: readonly GardenActivity[],
): string | null {
  const d: ActivityDetails = activity.details
  if (!d.sourceHarvestId) return 'Selecciona una cosecha real registrada en la bitácora.'
  const harvest = events.find(x => x.id === d.sourceHarvestId && x.type === 'harvest' && !x.voidedAt)
  if (!harvest) return 'No se encontró una cosecha vigente. Debes registrar la cosecha antes de iniciar poscosecha.'
  if (!d.postharvestStep || !Object.hasOwn(POSTHARVEST_STEPS, d.postharvestStep)) return 'Selecciona una etapa válida de poscosecha.'
  if (activity.date < harvest.date) return 'La poscosecha no puede anteceder a la cosecha original.'
  if (harvest.target.kind !== 'garden' && (activity.target.kind === 'garden' || activity.target.plot !== harvest.target.plot))
    return 'El lote debe conservar el espacio de su cosecha original.'
  if (harvest.target.kind === 'garden' && activity.target.kind !== 'garden') return 'La ubicación no corresponde a la cosecha.'

  const related = events.filter(x => x.id !== activity.id && !x.voidedAt && x.type === 'postharvest' && x.details.sourceHarvestId === harvest.id)
  const completed = POSTHARVEST_ORDER.filter(step => related.some(x => x.details.postharvestStep === step))
  const next = POSTHARVEST_ORDER[completed.length]
  if (!next || d.postharvestStep !== next) return next
    ? 'El siguiente paso documentable es «' + POSTHARVEST_STEPS[next] + '». Corrige o anula el registro anterior si corresponde.'
    : 'El lote ya tiene documentadas todas las etapas de poscosecha.'
  const last = related.filter(x => completed.includes(x.details.postharvestStep as PostHarvestStep))
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  if (last && activity.date < last.date) return 'La nueva etapa no puede anteceder a la etapa anterior.'

  if (d.postharvestStep === 'drying-start' && d.method !== 'shade')
    return 'Documenta el método de secado a la sombra, según los lineamientos del proyecto.'
  if (d.postharvestStep === 'packaging') {
    if (!d.batchCode?.trim()) return 'Identifica el lote de cosecha para su etiqueta.'
    if (!d.packageDate || !Number.isFinite(dateValue(d.packageDate)) || d.packageDate !== activity.date)
      return 'La fecha de empaquetado debe coincidir con la fecha documentada.'
    if (!d.expiryDate || !Number.isFinite(dateValue(d.expiryDate)) || d.expiryDate <= d.packageDate)
      return 'Indica una caducidad posterior al empaquetado, sin asumirla automáticamente.'
    if (!d.storageLabel?.trim()) return 'Registra las indicaciones de uso y advertencias que acompañarán la etiqueta.'
  }
  if (d.postharvestStep === 'storage' && !d.storagePlace?.trim()) return 'Identifica dónde se almacenó realmente el lote.'
  return null
}
