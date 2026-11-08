import { provinces } from '../../EcuadorMap'
import { officialCantons, officialParishes, provinceForName, territoryLabel } from './territory'
import { GARDEN_FEATURE_OPTIONS, toGardenFeatures, type GardenFeatures } from './garden-characteristics'

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
  loam: 'Franco', clay: 'Arcilloso', sand: 'Arenoso', silt: 'Limoso', marl: 'Margoso', heavyClay: 'Gredoso', marsh: 'Pantanoso', other: 'Otro', unknown: 'Por determinar',
} as const

export type GardenKind = keyof typeof GARDEN_KINDS
export type IrrigationAvailability = keyof typeof IRRIGATION_OPTIONS
export type SoilType = keyof typeof SOIL_OPTIONS
export type GardenCoordinates = { latitude: number; longitude: number }

export type RealGarden = {
  name: string
  kind: GardenKind
  location: {
    province: string; provinceCode: string; canton: string; cantonCode: string | null
    parish: string; parishCode: string | null; reference: string; coordinates: GardenCoordinates | null
  }
  areaM2: number
  irrigationAvailability: IrrigationAvailability
  soilType: SoilType | null
  communityName: string | null
  characteristics?: GardenFeatures
  photo?: File
}

export type RealGardenDraft = {
  name: string
  kind: GardenKind | ''
  province: string
  cantonCode: string
  parishCode: string
  coordinates: GardenCoordinates | null
  reference: string
  areaM2: string
  irrigationAvailability: IrrigationAvailability | ''
  soilType: SoilType | ''
  characteristics?: GardenFeatures
  photo?: File
}
export type RealGardenErrors = Partial<Record<keyof RealGardenDraft, string>>

export function toGardenDraft(garden: RealGarden | null): RealGardenDraft {
  return garden ? {
    name: garden.name, kind: garden.kind, province: garden.location.province,
    cantonCode: garden.location.cantonCode ?? '', parishCode: garden.location.parishCode ?? '',
    coordinates: garden.location.coordinates, reference: garden.location.reference, areaM2: String(garden.areaM2),
    irrigationAvailability: garden.irrigationAvailability, soilType: garden.soilType ?? '',
    characteristics: toGardenFeatures(garden.characteristics), photo: garden.photo,
  } : { name: '', kind: '', province: '', cantonCode: '', parishCode: '', coordinates: null, reference: '', areaM2: '', irrigationAvailability: '', soilType: '', characteristics: toGardenFeatures() }
}

export function parseRealGarden(draft: RealGardenDraft, communityName: string | null):
  { ok: true; garden: RealGarden } | { ok: false; errors: RealGardenErrors } {
  const errors: RealGardenErrors = {}
  const characteristics = toGardenFeatures(draft.characteristics)
  const areaM2 = Number(draft.areaM2)
  const province = provinceForName(draft.province)
  const canton = officialCantons.find(item => item.code === draft.cantonCode && item.provinceCode === province?.code)
  const parish = officialParishes.find(item => item.code === draft.parishCode && item.cantonCode === canton?.code)
  if (!provinces.includes(draft.province)) errors.province = 'Selecciona una provincia de Ecuador.'
  if (draft.name.trim().length < 3 || draft.name.trim().length > 100) errors.name = 'Escribe un nombre de entre 3 y 100 caracteres.'
  if (!Object.hasOwn(GARDEN_KINDS, draft.kind)) errors.kind = 'Selecciona uno de los cuatro tipos de huerto.'
  if (!draft.areaM2.trim() || !Number.isFinite(areaM2) || areaM2 < 0.01) errors.areaM2 = 'Indica una superficie de al menos 0,01 m².'
  if (!Object.hasOwn(IRRIGATION_OPTIONS, draft.irrigationAvailability)) errors.irrigationAvailability = 'Indica la disponibilidad de agua o elige «Por determinar».'
  if (draft.kind === 'ground' && !Object.hasOwn(SOIL_OPTIONS, draft.soilType)) errors.soilType = 'Selecciona el tipo de suelo o elige «Por determinar».'
  if (draft.cantonCode && !canton) errors.cantonCode = 'Selecciona un cantón de la provincia elegida.'
  if (draft.parishCode && !parish) errors.parishCode = 'Selecciona una parroquia del cantón elegido.'
  if (draft.coordinates && (!Number.isFinite(draft.coordinates.latitude) || Math.abs(draft.coordinates.latitude) > 90 ||
    !Number.isFinite(draft.coordinates.longitude) || Math.abs(draft.coordinates.longitude) > 180)) errors.coordinates = 'Marca una posición válida en el mapa.'
  if (draft.reference.trim().length > 300) errors.reference = 'Usa hasta 300 caracteres para la dirección o referencia.'
  for (const field of Object.keys(GARDEN_FEATURE_OPTIONS) as (keyof GardenFeatures)[]) {
    if (characteristics[field].some(value => !Object.hasOwn(GARDEN_FEATURE_OPTIONS[field], value))) errors.characteristics = 'Revisa las características seleccionadas.'
  }
  if (draft.photo && !draft.photo.type.startsWith('image/')) errors.photo = 'Selecciona un archivo de imagen para la fotografía del terreno.'
  if (Object.keys(errors).length) return { ok: false, errors }
  return { ok: true, garden: {
    name: draft.name.trim(), kind: draft.kind as GardenKind, areaM2,
    location: {
      province: draft.province, provinceCode: province!.code, canton: canton ? territoryLabel(canton.name) : '', cantonCode: canton?.code ?? null,
      parish: parish ? territoryLabel(parish.name) : '', parishCode: parish?.code ?? null,
      reference: draft.reference.trim(), coordinates: draft.coordinates ? { ...draft.coordinates } : null,
    },
    irrigationAvailability: draft.irrigationAvailability as IrrigationAvailability,
    soilType: draft.kind === 'ground' ? draft.soilType as SoilType : null, communityName,
    characteristics, photo: draft.photo,
  } }
}

export function formatGardenArea(area: number) {
  return `${new Intl.NumberFormat('es-EC', { maximumFractionDigits: 10 }).format(area)} m²`
}
