import { provinces } from '../../EcuadorMap'

export const GARDEN_KINDS = {
  ground: { label: 'En tierra', description: 'Cultivo directo en el suelo.' },
  pots: { label: 'Macetas', description: 'En recipientes, macetas o tiestos.' },
  vertical: { label: 'Vertical', description: 'En paredes o estructuras verticales.' },
  hanging: { label: 'Colgante', description: 'En maceteros o canastas suspendidas.' },
} as const

export const IRRIGATION_OPTIONS = {
  available: 'Disponible todo el año',
  seasonal: 'Disponible por temporadas',
  unavailable: 'Sin agua de riego disponible',
  unknown: 'Por determinar',
} as const

export const SOIL_OPTIONS = {
  loam: 'Franco', clay: 'Arcilloso', sand: 'Arenoso', silt: 'Limoso', other: 'Otro', unknown: 'Por determinar',
} as const

export type GardenKind = keyof typeof GARDEN_KINDS
export type IrrigationAvailability = keyof typeof IRRIGATION_OPTIONS
export type SoilType = keyof typeof SOIL_OPTIONS

export type RealGarden = {
  name: string
  kind: GardenKind
  location: { province: string; canton: string; parish: string; reference: string }
  areaM2: number
  irrigationAvailability: IrrigationAvailability
  soilType: SoilType | null
  communityName: string | null
}

export type RealGardenDraft = {
  name: string
  kind: GardenKind | ''
  province: string
  canton: string
  parish: string
  reference: string
  areaM2: string
  irrigationAvailability: IrrigationAvailability | ''
  soilType: SoilType | ''
}
export type RealGardenErrors = Partial<Record<keyof RealGardenDraft, string>>

export function toGardenDraft(garden: RealGarden | null): RealGardenDraft {
  return garden ? {
    name: garden.name, kind: garden.kind, ...garden.location, areaM2: String(garden.areaM2),
    irrigationAvailability: garden.irrigationAvailability, soilType: garden.soilType ?? '',
  } : { name: '', kind: '', province: '', canton: '', parish: '', reference: '', areaM2: '', irrigationAvailability: '', soilType: '' }
}

export function parseRealGarden(draft: RealGardenDraft, communityName: string | null):
  { ok: true; garden: RealGarden } | { ok: false; errors: RealGardenErrors } {
  const errors: RealGardenErrors = {}
  const areaM2 = Number(draft.areaM2)
  if (!provinces.includes(draft.province)) errors.province = 'Selecciona una provincia de Ecuador.'
  if (draft.name.trim().length < 3 || draft.name.trim().length > 100) errors.name = 'Escribe un nombre de entre 3 y 100 caracteres.'
  if (!Object.hasOwn(GARDEN_KINDS, draft.kind)) errors.kind = 'Selecciona uno de los cuatro tipos de huerto.'
  if (!draft.areaM2.trim() || !Number.isFinite(areaM2) || areaM2 < 0.01) errors.areaM2 = 'Indica una superficie de al menos 0,01 m².'
  if (!Object.hasOwn(IRRIGATION_OPTIONS, draft.irrigationAvailability)) errors.irrigationAvailability = 'Indica la disponibilidad de agua o elige «Por determinar».'
  if (draft.kind === 'ground' && !Object.hasOwn(SOIL_OPTIONS, draft.soilType)) errors.soilType = 'Selecciona el tipo de suelo o elige «Por determinar».'
  if (draft.canton.trim().length > 80) errors.canton = 'Usa hasta 80 caracteres para el cantón.'
  if (draft.parish.trim().length > 80) errors.parish = 'Usa hasta 80 caracteres para la parroquia.'
  if (draft.reference.trim().length > 300) errors.reference = 'Usa hasta 300 caracteres para la dirección o referencia.'
  if (Object.keys(errors).length) return { ok: false, errors }
  return { ok: true, garden: {
    name: draft.name.trim(), kind: draft.kind as GardenKind, areaM2,
    location: { province: draft.province, canton: draft.canton.trim(), parish: draft.parish.trim(), reference: draft.reference.trim() },
    irrigationAvailability: draft.irrigationAvailability as IrrigationAvailability,
    soilType: draft.kind === 'ground' ? draft.soilType as SoilType : null, communityName,
  } }
}

export function formatGardenArea(area: number) {
  return `${new Intl.NumberFormat('es-EC', { maximumFractionDigits: 10 }).format(area)} m²`
}
