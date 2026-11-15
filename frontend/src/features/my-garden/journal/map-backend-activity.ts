import type { BackendActivity } from '../../../shared/api/client'
import { resolveMediaUrl } from '../../../shared/api/client'
import type { GardenActivity } from './activities'

/** Adaptación estable del contrato HTTP a la bitácora usada por el jardín. */
export function mapBackendActivity(b: BackendActivity): GardenActivity {
    let detailsObj: any = {}
    try {
      detailsObj = typeof b.details === 'string' ? JSON.parse(b.details || '{}') : (b.details || {})
    } catch {
      detailsObj = {}
    }
    const target: GardenActivity['target'] =
      b.targetKind === 'plant' && b.plantId
        ? { kind: 'plant', plantId: b.plantId, plot: b.plotIndex ?? 0 }
        : b.targetKind === 'plot'
        ? { kind: 'plot', plot: b.plotIndex ?? 0 }
        : { kind: 'garden' }

    const photoUrls = b.evidences?.map(e => resolveMediaUrl(e.fileUrl)) || []

    return {
      id: b.id,
      gardenId: b.gardenId,
      type: b.type as any,
      date: b.performedDate,
      responsible: b.actorUser?.name || 'Comunidad',
      target,
      notes: b.notes || '',
      photoIds: photoUrls.map((_, i) => `${b.id}-photo-${i}`),
      photos: photoUrls,
      details: detailsObj,
      createdAt: b.createdAt,
      validation: 'local-v1',
      voidedAt: b.voidedAt ?? undefined,
      voidReason: b.voidReason ?? undefined,
      reviewStatus: b.reviewStatus ?? undefined,
      reviewedById: b.reviewedById ?? undefined,
      reviewReason: b.reviewReason ?? undefined,
      reviewedAt: b.reviewedAt ?? undefined,
      careLogId: b.careLogId ?? null,
      harvestRecordId: b.harvestRecordId ?? null,
    }
  }
