import type { Species, CareLogEntry } from './care-rules'

export async function validateCareAction(
  plantId: string,
  actionType: string,
  plant: {
    lifecycleStatus: string
    species: Species
    careLogs: CareLogEntry[]
    plantingDate?: Date | null
    lastHarvestDate?: Date | null
  }
): Promise<{ allowed: boolean; warningMessage: string }> {
  const now = new Date()
  const { species, careLogs } = plant

  if (actionType === 'WATERING') {
    // Detectar si ya fue regada recientemente (menos de wateringFrequencyDays)
    const lastWatering = careLogs
      .filter(l => l.actionType === 'WATERING')
      .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())[0]
    if (lastWatering) {
      const daysSince = (now.getTime() - new Date(lastWatering.performedAt).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince < species.wateringFrequencyDays) {
        // Si además hubo más de 2 riegos en 24 h, es exceso peligroso
        const wateringsLast24h = careLogs.filter(l => {
          const hrs = (now.getTime() - new Date(l.performedAt).getTime()) / (1000 * 60 * 60)
          return l.actionType === 'WATERING' && hrs <= 24
        }).length
        if (wateringsLast24h >= 2) {
          return {
            allowed: false,
            warningMessage: '⚠️ Suelo saturado de agua: riesgo inminente de asfixia radicular y pudrición de raíces. No se puede regar ahora.',
          }
        }
      }
    }
  }

  if (actionType === 'FERTILIZER') {
    const lastFertilizer = careLogs
      .filter(l => l.actionType === 'FERTILIZER')
      .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())[0]
    if (lastFertilizer) {
      const daysSince = (now.getTime() - new Date(lastFertilizer.performedAt).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince < species.fertilizerFrequencyDays * 0.5) {
        const fertilizersLast24h = careLogs.filter(l => {
          const hrs = (now.getTime() - new Date(l.performedAt).getTime()) / (1000 * 60 * 60)
          return l.actionType === 'FERTILIZER' && hrs <= 24
        }).length
        if (fertilizersLast24h >= 1) {
          return {
            allowed: false,
            warningMessage: '⚠️ Suelo sobrefertilizado: exceso de sales puede quemar las raíces. No se puede abonar ahora.',
          }
        }
      }
    }
  }

  if (actionType === 'PRUNING') {
    const pruningsLastWeek = careLogs.filter(l => {
      const days = (now.getTime() - new Date(l.performedAt).getTime()) / (1000 * 60 * 60 * 24)
      return l.actionType === 'PRUNING' && days <= 7
    }).length
    if (pruningsLastWeek >= 1) {
      return {
        allowed: false,
        warningMessage: '⚠️ La planta ya se encuentra podada y con su mantenimiento al día. Espera a que complete su ciclo para podarla nuevamente.',
      }
    }
  }

  return { allowed: true, warningMessage: '' }
}
