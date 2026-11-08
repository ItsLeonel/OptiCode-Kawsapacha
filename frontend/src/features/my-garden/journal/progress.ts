import type { GardenJournal } from './journal'
import { ACTIVITY_TYPES, activityKey, validateActivity, type ActivityType } from './activities'
import { validDate } from '../plant-record'

/** Local rules V1, not server-approved balances or verification of physical actions. */
export const LOCAL_POINTS: Readonly<Record<ActivityType, number>> = {
  preparation: 10, weeding: 8, sowing: 20, watering: 5, fertilizing: 8, hilling: 8, replanting: 10, observation: 12, harvest: 20,
}
export const LOCAL_LEVELS = [{ name: 'Aprendiz', threshold: 0 }, { name: 'Oficial', threshold: 100 }, { name: 'Maestro', threshold: 300 }] as const
export const normalizeResponsible = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es')

export function calculateProgress(journal: GardenJournal, responsible?: string) {
  const identities = new Set<string>(), fingerprints = new Set<string>(), rewardedDays = new Set<string>()
  const eligible = journal.activities.filter(activity => activity.gardenId === journal.gardenId && !activity.voidedAt && activity.validation === 'local-v1' && activity.id && Object.hasOwn(ACTIVITY_TYPES, activity.type) && validDate(activity.date) && activity.responsible.trim().length >= 2 && (!responsible || normalizeResponsible(activity.responsible) === normalizeResponsible(responsible)) && (activity.target.kind !== 'plant' || journal.plants.some(plant => plant.id === (activity.target as { plantId: string }).plantId)))
    .filter(activity => {
      const target = activity.target
      const plant = target.kind === 'plant' ? journal.plants.find(item => item.id === target.plantId) : undefined
      // Validate immutable event content against its recorded location. Later archiving or
      // occupation by another plant must not erase an earlier legitimate recognition.
      return !validateActivity(activity, plant && target.kind === 'plant' ? [{ ...plant, archivedAt: undefined, plot: target.plot }] : [])
    }).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)).filter(activity => {
      const key = activityKey(activity)
      if (identities.has(activity.id) || fingerprints.has(key)) return false
      identities.add(activity.id); fingerprints.add(key); return true
    })
  const ledger = eligible.map(activity => {
    const target = activity.target.kind === 'garden' ? 'garden' : activity.target.kind === 'plot' ? `plot:${activity.target.plot}` : `plant:${activity.target.plantId}`
    const key = `${activity.type}|${activity.date}|${target}|${normalizeResponsible(activity.responsible)}`
    const points = rewardedDays.has(key) ? 0 : LOCAL_POINTS[activity.type]
    rewardedDays.add(key)
    return { activityId: activity.id, type: activity.type, date: activity.date, responsible: activity.responsible, points }
  })
  const points = ledger.reduce((total, item) => total + item.points, 0)
  const levelIndex = points >= 300 ? 2 : points >= 100 ? 1 : 0
  const level = LOCAL_LEVELS[levelIndex], next = LOCAL_LEVELS[levelIndex + 1]
  const wateringDays = new Set(eligible.filter(item => item.type === 'watering').map(item => item.date)).size
  const observedDays = new Set(eligible.filter(item => item.type === 'observation' && item.photoIds.length).map(item => item.date)).size
  const badges = [
    { id: 'first-sowing', label: 'La primera semilla', criterion: 'Una siembra registrada con fotografía', earned: eligible.some(item => item.type === 'sowing' && item.photoIds.length > 0) },
    { id: 'care', label: 'Raíces cuidadas', criterion: 'Riego documentado en tres fechas distintas', earned: wateringDays >= 3 },
    { id: 'observer', label: 'Mirada atenta', criterion: 'Seguimiento con foto en tres fechas distintas', earned: observedDays >= 3 },
    { id: 'harvest', label: 'Cosecha con memoria', criterion: 'Una cosecha registrada con evidencia fotográfica', earned: eligible.some(item => item.type === 'harvest' && item.photoIds.length > 0) },
  ]
  return { points, level: level.name, nextLevel: next?.name, remaining: next ? Math.max(0, next.threshold - points) : 0,
    progressPercent: next ? Math.min(100, Math.round((points - level.threshold) / (next.threshold - level.threshold) * 100)) : 100,
    ledger, badges, activities: eligible.length,
  }
}
