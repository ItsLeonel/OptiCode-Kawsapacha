import type { ActivityType } from '../domain/activity-types'

export interface CreateActivityInput {
  gardenId: string
  actorUserId: string
  type: ActivityType
  performedDate: string // YYYY-MM-DD
  targetKind: 'garden' | 'plot' | 'plant'
  plantId?: string | null
  plotIndex?: number | null
  notes?: string
  details?: Record<string, unknown>
  clientActivityId?: string | null
  evidenceFile?: {
    filename: string
    path: string
    mimetype: string
    size: number
  } | null
}
