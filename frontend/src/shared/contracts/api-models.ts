import type { GardenFeatures } from './garden-features'

/** DTOs de transporte independientes de las pantallas. Sus campos reflejan contratos API V1. */
export type AuthSubmission =
  | { mode: 'register'; name: string; email: string; password: string }
  | { mode: 'login'; email: string; password: string }

export type Community = {
  id?: string
  name: string
  responsible: string
  location: string
  description: string
  type?: CommunityType
  province?: string
  cantonCode?: string
  parishCode?: string
  sector?: string
  contact?: { phone: string; email: string }
  members?: CommunityMember[]
  coverPhoto?: File
  photoUrl?: string | null
  removePhoto?: boolean
  status?: 'PENDING' | 'APPROVED' | 'NEEDS_CHANGES' | 'REJECTED' | string
  reviewedById?: string | null
  reviewReason?: string | null
  reviewedAt?: string | null
}

export type CommunityType = 'personal' | 'familiar' | 'condominio' | 'barrial'
export type CommunityMember = {
  id: string
  name: string
  email?: string
  role?: 'RESPONSABLE' | 'PARTICIPANTE'
  birthDate?: string
  gender?: string
  certifiedTalents?: string
  experience: 'Aprendiz' | 'Oficial' | 'Maestro'
  inviteStatus?: 'idle' | 'checking' | 'not_found' | 'verified' | 'ready_to_send' | 'sent' | 'pending' | 'already_member'
  lookupMessage?: string
}

export type GardenKind = 'ground' | 'pots' | 'vertical' | 'hanging'
export type IrrigationAvailability = 'available' | 'seasonal' | 'unavailable' | 'unknown'
export type SoilType = 'loam' | 'clay' | 'sand' | 'silt' | 'marl' | 'heavyClay' | 'marsh' | 'other' | 'unknown'
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
