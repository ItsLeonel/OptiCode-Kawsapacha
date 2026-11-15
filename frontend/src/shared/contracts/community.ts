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

export type CommunityPayload = Pick<Community, 'name' | 'responsible' | 'location' | 'description' | 'type' | 'province' | 'cantonCode' | 'parishCode' | 'sector'>
export type CommunitySave = (community: Community) => void | Promise<void>

export type CommunitySpace = 'wisdom' | 'experience' | 'practice' | 'conversations' | 'news' | 'communities' | 'garden' | 'activities'

