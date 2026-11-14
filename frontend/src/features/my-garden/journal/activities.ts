import { PLANT_STATES, type GardenPlant, type PlantState } from '../garden'
import { isGrowthStage, type GrowthStage } from '../growth-stages'
import { validDate } from '../plant-record'

export const ACTIVITY_TYPES = {
  preparation: 'Preparación del terreno', weeding: 'Limpieza y deshierbe', sowing: 'Siembra', watering: 'Riego',
  fertilizing: 'Abonado', hilling: 'Aporque', replanting: 'Replante', observation: 'Seguimiento del crecimiento', harvest: 'Cosecha',
  ritualSowing: 'Ritual de siembra', ritualHarvest: 'Ritual de gratitud antes de cosechar', signage: 'Señalética de la planta',
  cleaning: 'Limpieza de la cosecha', drying: 'Secado a la sombra', packaging: 'Empaquetado y etiquetado', storage: 'Almacenaje de la cosecha',
} as const
export type ActivityType = keyof typeof ACTIVITY_TYPES
export type ActivityTarget = { kind: 'garden' } | { kind: 'plot'; plot: number } | { kind: 'plant'; plantId: string; plot: number }
export type ActivityDetails = {
  method?: string; material?: string; quantity?: number; unit?: 'L' | 'kg' | 'g' | 'unidades'
  heightCm?: number; state?: PlantState; growthStage?: GrowthStage; destinationPlot?: number; harvestMode?: 'partial' | 'complete'; releasePlot?: boolean
  // Metadatos declarados por quien realiza la labor; nunca son inferidos ni recomendaciones clínicas.
  sowingMaterial?: 'seed' | 'stake' | 'cutting' | 'seedling'
  groundTechnique?: 'furrows' | 'beds' | 'raisedBeds' | 'terraces'
  sourceHarvestId?: string; plantPart?: 'leaves' | 'flowers' | 'fruits' | 'seeds' | 'roots' | 'other'
  packagedOn?: string; expiryDate?: string; storageLocation?: string
  labelCommonName?: string; labelScientificName?: string; labelUse?: string; labelWarnings?: string; labelDose?: string
  traditionalType?: 'hot' | 'cool' | 'unknown'
}
export type GardenActivity = {
  id: string; gardenId: string; type: ActivityType; date: string; responsible: string; target: ActivityTarget
  notes: string; photoIds: string[]; photos?: string[]; details: ActivityDetails; createdAt: string
  validation: 'local-v1'; voidedAt?: string; voidReason?: string
}
export type ActivityDraft = Omit<GardenActivity, 'gardenId' | 'createdAt' | 'validation' | 'photoIds' | 'photos'> & { photo?: Blob }

export function activityKey(activity: Pick<GardenActivity, 'type' | 'date' | 'responsible' | 'target' | 'notes' | 'details'> & { photoIds?: readonly string[] }) {
  const target = activity.target.kind === 'garden' ? 'garden' : activity.target.kind === 'plot' ? `plot:${activity.target.plot}` : `plant:${activity.target.plantId}`
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es')
  const details = Object.entries(activity.details).filter(([, value]) => value !== undefined && value !== '').sort(([a], [b]) => a.localeCompare(b))
  // A new photographic evidence is a separate record even with identical notes.
  // Daily reward limits remain independent of this record deduplication.
  return JSON.stringify([activity.type, activity.date, target, normalize(activity.responsible), normalize(activity.notes), details, [...(activity.photoIds ?? [])].sort()])
}

export function validateActivity(activity: GardenActivity, plants: readonly GardenPlant[]): string | null {
  if (!Object.hasOwn(ACTIVITY_TYPES, activity.type)) return 'Selecciona una actividad válida.'
  if (!validDate(activity.date)) return 'Indica una fecha válida, hasta hoy.'
  if (activity.responsible.trim().length < 2 || activity.responsible.length > 100) return 'Indica quién realizó la actividad (2–100 caracteres).'
  if (activity.notes.length > 2000) return 'Usa hasta 2000 caracteres para las observaciones.'
  const target = activity.target
  if (!['garden', 'plot', 'plant'].includes(target.kind)) return 'Selecciona el huerto, un espacio o una planta.'
  if (target.kind !== 'garden' && (!Number.isInteger(target.plot) || target.plot < 0 || target.plot >= 6)) return 'Selecciona un espacio válido.'
  const plant = target.kind === 'plant' ? plants.find(item => item.id === target.plantId) : undefined
  if (target.kind === 'plant' && (!plant || plant.archivedAt || plant.plot !== target.plot)) return 'La planta ya no ocupa ese espacio. Revisa la ubicación antes de guardar.'
  if (['sowing', 'hilling', 'replanting', 'observation', 'harvest'].includes(activity.type) && !plant) return 'Esta actividad requiere una planta registrada. Primero registra la planta en el espacio correspondiente.'
  if (plant?.plantedOn && activity.date < plant.plantedOn) return 'La actividad no puede ser anterior a la siembra registrada.'
  if (activity.type === 'sowing' && plant?.plantedOn && plant.plantedOn !== activity.date) return 'La fecha debe coincidir con la siembra de la ficha. Corrige la ficha si es necesario.'
  const detail = activity.details
  if ((detail.heightCm !== undefined || detail.state !== undefined || detail.growthStage !== undefined) && activity.type !== 'observation') return 'Las medidas y el estado se documentan mediante una actividad de seguimiento.'
  if (detail.destinationPlot !== undefined && activity.type !== 'replanting') return 'El cambio de espacio corresponde a un replante.'
  if (detail.harvestMode !== undefined && activity.type !== 'harvest') return 'El tipo de cosecha corresponde a una actividad de cosecha.'
  if (detail.sowingMaterial !== undefined && activity.type !== 'sowing') return 'El material de siembra solo se registra durante la siembra.'
  if (detail.groundTechnique !== undefined && !['sowing', 'preparation'].includes(activity.type)) return 'La técnica de terreno corresponde a preparación o siembra.'
  if (detail.sourceHarvestId !== undefined && !['cleaning', 'drying', 'packaging', 'storage'].includes(activity.type)) return 'El lote de cosecha solo corresponde a la poscosecha.'
  if (detail.plantPart !== undefined && !['harvest', 'packaging'].includes(activity.type)) return 'Indica la parte cosechada durante la cosecha o empaquetado.'
  for (const value of [detail.quantity, detail.heightCm]) if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 1000000)) return 'Revisa las cantidades y medidas registradas.'
  if (detail.quantity !== undefined && detail.quantity === 0) return 'La cantidad debe ser mayor que cero.'
  if (detail.quantity !== undefined && (!detail.unit || !['L', 'kg', 'g', 'unidades'].includes(detail.unit))) return 'Indica la unidad de la cantidad.'
  if (detail.state !== undefined && !Object.hasOwn(PLANT_STATES, detail.state)) return 'Selecciona un estado documentado válido.'
  if (detail.growthStage !== undefined && !isGrowthStage(detail.growthStage)) return 'Selecciona una etapa de crecimiento válida.'
  if (activity.type === 'observation' && detail.growthStage !== undefined && detail.growthStage !== plant?.growthStage && !activity.photoIds.length) return 'Añade una foto real para documentar el cambio de etapa.'
  if ((detail.material?.length ?? 0) > 100 || (detail.method?.length ?? 0) > 100) return 'Describe el método o material en hasta 100 caracteres.'
  for (const value of [detail.storageLocation, detail.labelCommonName, detail.labelScientificName, detail.labelUse, detail.labelWarnings, detail.labelDose]) if ((value?.length ?? 0) > 300) return 'Los campos de etiquetado y almacenamiento permiten hasta 300 caracteres.'
  if (detail.packagedOn && !validDate(detail.packagedOn)) return 'Indica una fecha válida de empaquetado.'
  if (detail.expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(detail.expiryDate)) return 'Indica una fecha de caducidad válida.'
  if (detail.packagedOn && detail.expiryDate && detail.expiryDate < detail.packagedOn) return 'La caducidad debe ser posterior al empaquetado.'
  if (activity.type === 'packaging' && (!detail.labelCommonName?.trim() || !detail.labelScientificName?.trim() || !detail.packagedOn || !detail.expiryDate)) return 'Para etiquetar indica nombre común, científico, fecha de empaque y caducidad real declarada.'
  if (activity.type === 'storage' && !detail.storageLocation?.trim()) return 'Indica dónde almacenaste el lote.'
  if (activity.type === 'observation' && !activity.notes.trim() && !activity.photoIds.length && detail.heightCm === undefined && detail.state === undefined && detail.growthStage === undefined) return 'Añade una observación, fotografía, medida o estado documentado.'
  if (activity.type === 'replanting') {
    if (!Number.isInteger(detail.destinationPlot) || detail.destinationPlot! < 0 || detail.destinationPlot! >= 6 || detail.destinationPlot === plant?.plot) return 'Elige un espacio de destino distinto y válido.'
    if (plants.some(item => !item.archivedAt && item.id !== plant?.id && item.plot === detail.destinationPlot)) return 'El espacio de destino está ocupado. No se sustituirá su planta.'
  }
  if (activity.type === 'harvest' && !['partial', 'complete'].includes(detail.harvestMode ?? '')) return 'Indica si la cosecha fue parcial o completa.'
  if (detail.releasePlot && (activity.type !== 'harvest' || detail.harvestMode !== 'complete')) return 'Solo una cosecha completa permite liberar el espacio.'
  return null
}

export function activityAffectsPlot(activity: GardenActivity, plot: number) {
  return !activity.voidedAt && (activity.target.kind === 'garden' || activity.target.plot === plot)
}
