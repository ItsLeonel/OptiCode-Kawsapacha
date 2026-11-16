import type { GardenFeatures } from './garden-features'

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
  id?: string
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
  createdById?: string
  characteristics?: GardenFeatures
  photo?: File
  photoUrl?: string | null
  removePhoto?: boolean
  communityProvince?: string
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
  photoUrl?: string | null
  removePhoto?: boolean
}
export type RealGardenErrors = Partial<Record<keyof RealGardenDraft, string>>

export function formatGardenArea(area: number) {
  return `${new Intl.NumberFormat('es-EC', { maximumFractionDigits: 10 }).format(area)} m²`
}
