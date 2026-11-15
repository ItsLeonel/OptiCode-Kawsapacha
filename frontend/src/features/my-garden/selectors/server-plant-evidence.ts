import type { GardenPlant } from '../garden'
import type { GardenActivity } from '../journal/activities'
import { isGrowthStage } from '../growth-stages'

/** Aplica evidencias persistidas a las plantas sin depender de componentes React. */
export function attachServerEvidence(backendPlants: GardenPlant[], backendActivities: GardenActivity[], activeGardenId: string | null): GardenPlant[] {
  return backendPlants.map(plant => {
    const evidences = backendActivities
      .filter(activity =>
        !activity.voidedAt &&
        activity.gardenId === activeGardenId &&
        (activity.type === 'sowing' || activity.type === 'observation') &&
        activity.target.kind === 'plant' && activity.target.plantId === plant.id
      )
      .flatMap(activity => (activity.photos ?? []).map((photo, index) => ({
        id: `${activity.id}-evidence-${index}`,
        date: activity.date,
        notes: activity.notes,
        photo,
        photoId: activity.photoIds[index],
        growthStage: isGrowthStage(activity.details.growthStage) ? activity.details.growthStage : undefined,
        heightCm: typeof activity.details.heightCm === 'number' ? activity.details.heightCm : undefined,
        reviewStatus: activity.reviewStatus,
      })))
      .sort((a, b) => a.date.localeCompare(b.date))
    return { ...plant, evidences }
  })
}
