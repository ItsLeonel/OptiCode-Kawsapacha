// ─── Días de rebrote por especie (catálogo botánico andino) ───────────────────
// Menta / Hierbabuena: 14-18 días | Manzanilla: 12-15 | Llantén: 12-16
// Toronjil: 18-22 | Orégano: 20-25 | Romero / Lavanda: 25-35 | Fallback: 20
export function getRegrowthDaysByName(speciesName: string): number {
  const name = speciesName.toLowerCase()
  if (name.includes('menta') || name.includes('hierbabuena')) return 16   // promedio 14-18
  if (name.includes('manzanilla')) return 13                              // promedio 12-15
  if (name.includes('llantén') || name.includes('llanten')) return 14    // promedio 12-16
  if (name.includes('toronjil')) return 20                               // promedio 18-22
  if (name.includes('orégano') || name.includes('oregano')) return 22   // promedio 20-25
  if (name.includes('romero') || name.includes('lavanda')) return 30     // promedio 25-35
  return 20                                                               // fallback
}

// ─── Estados de salud de la planta ───────────────────────────────────────────
export type HealthStatus =
  | 'VIGOROSA'      // Sin excesos ni deficiencias
  | 'EXCESO_AGUA'   // Riesgo de asfixia radicular
  | 'EXCESO_ABONO'  // Riesgo de toxicidad salina
  | 'ESTRES_PODA'   // Poda excesiva o muy frecuente
  | 'REQUIERE_RIEGO'
  | 'REQUIERE_ABONO'

// ─── Tipos internos ───────────────────────────────────────────────────────────

export type Species = {
  name: string
  wateringFrequencyDays: number
  fertilizerFrequencyDays: number
  growthCycleDays: number
  lunarPhaseTip: string
  bestPlantingSeason: string
}

export type CareLogEntry = {
  actionType: string
  performedAt: Date
}

export type PlantData = {
  plantingDate: Date
  lifecycleStatus: string
  lastHarvestDate?: Date | null
}

// ─── Lógica de crecimiento y salud ───────────────────────────────────────────

export function calculateGrowthData(
  plant: PlantData,
  species: Species,
  careLogs: CareLogEntry[]
) {
  const now = new Date()
  const isRegrowing = plant.lifecycleStatus === 'REGROWING'

  // Punto de referencia: si está en rebrote usar lastHarvestDate, si no usar plantingDate
  const referenceDate = isRegrowing && plant.lastHarvestDate
    ? new Date(plant.lastHarvestDate)
    : new Date(plant.plantingDate)

  const regrowthDays = getRegrowthDaysByName(species.name)
  const cycleDays = isRegrowing ? regrowthDays : species.growthCycleDays
  const daysElapsed = Math.max(0, (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24))

  // ── Detectar sobrecuidado (últimas 24 h) ──────────────────────────────────
  const last24h = 1 / 24 * 24  // 1 día en días = 1
  const wateringsLast24h = careLogs.filter(l => {
    const hrs = (now.getTime() - new Date(l.performedAt).getTime()) / (1000 * 60 * 60)
    return l.actionType === 'WATERING' && hrs <= 24
  }).length

  const fertilizersLast24h = careLogs.filter(l => {
    const hrs = (now.getTime() - new Date(l.performedAt).getTime()) / (1000 * 60 * 60)
    return l.actionType === 'FERTILIZER' && hrs <= 24
  }).length

  const pruningsLastWeek = careLogs.filter(l => {
    const days = (now.getTime() - new Date(l.performedAt).getTime()) / (1000 * 60 * 60 * 24)
    return l.actionType === 'PRUNING' && days <= 7
  }).length

  // Exceso: más de 2 riegos en 24 h, más de 1 abono en 24 h, más de 1 poda en una semana
  const overWatered = wateringsLast24h > 2
  const overFertilized = fertilizersLast24h > 1
  const overPruned = pruningsLastWeek >= 1

  // ── Determinar estado de salud ────────────────────────────────────────────
  let healthStatus: HealthStatus = 'VIGOROSA'
  if (overWatered) healthStatus = 'EXCESO_AGUA'
  else if (overFertilized) healthStatus = 'EXCESO_ABONO'
  else if (overPruned) healthStatus = 'ESTRES_PODA'

  // ── Calcular porcentaje base ──────────────────────────────────────────────
  // Si hay estrés (sobrecuidado), congelar avance sin bonos. Si no, calcular normalmente con bonos.
  const hasStress = overWatered || overFertilized || overPruned
  const basePercentage = Math.min(100, (daysElapsed / cycleDays) * 100)
  let percentage = basePercentage

  if (!hasStress) {
    // Bonus por riegos adecuados (dentro de frecuencia)
    const recentWaterings = careLogs.filter(l => {
      const daysSince = (now.getTime() - new Date(l.performedAt).getTime()) / (1000 * 60 * 60 * 24)
      return l.actionType === 'WATERING' && daysSince <= species.wateringFrequencyDays
    })
    percentage = Math.min(100, percentage + recentWaterings.length * 3)

    // Bonus por fertilizaciones adecuadas (dentro de frecuencia)
    const recentFertilizer = careLogs.filter(l => {
      const daysSince = (now.getTime() - new Date(l.performedAt).getTime()) / (1000 * 60 * 60 * 24)
      return l.actionType === 'FERTILIZER' && daysSince <= species.fertilizerFrequencyDays
    })
    percentage = Math.min(100, percentage + recentFertilizer.length * 2)
  }

  // En rebrote: porcentaje parte de 0% (barra reiniciada) y crece hasta 100%
  if (isRegrowing) {
    const regrowthPct = Math.min(100, (daysElapsed / regrowthDays) * 100)
    percentage = Math.min(100, regrowthPct)
  }

  percentage = Math.round(percentage)

  // ── Etapa de crecimiento ──────────────────────────────────────────────────
  let stage: string
  if (isRegrowing) {
    if (percentage < 25) stage = 'Rebrote inicial 🌱'
    else if (percentage < 50) stage = 'Rebrote y recuperación 🌿'
    else if (percentage < 75) stage = 'Crecimiento de rebrote 🪴'
    else stage = 'Lista para cosechar ✨'
  } else {
    if (percentage <= 25) stage = 'Semilla 🌱'
    else if (percentage <= 50) stage = 'Brote 🌿'
    else if (percentage <= 75) stage = 'Crecimiento 🪴'
    else stage = 'Lista para cosechar ✨'
  }

  const daysUntilHarvest = Math.max(0, Math.round(cycleDays - daysElapsed))

  // ── Necesidades de cuidado ────────────────────────────────────────────────
  const lastWatering = careLogs
    .filter(l => l.actionType === 'WATERING')
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())[0]
  const needsWatering = !lastWatering ||
    (now.getTime() - new Date(lastWatering.performedAt).getTime()) / (1000 * 60 * 60 * 24) >= species.wateringFrequencyDays

  const lastFertilizer = careLogs
    .filter(l => l.actionType === 'FERTILIZER')
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())[0]
  const needsFertilizer = !lastFertilizer ||
    (now.getTime() - new Date(lastFertilizer.performedAt).getTime()) / (1000 * 60 * 60 * 24) >= species.fertilizerFrequencyDays

  // Actualizar healthStatus con necesidades si no hay exceso
  if (healthStatus === 'VIGOROSA') {
    if (needsWatering) healthStatus = 'REQUIERE_RIEGO'
    if (needsFertilizer && !needsWatering) healthStatus = 'REQUIERE_ABONO'
    if (needsWatering && needsFertilizer) healthStatus = 'REQUIERE_RIEGO'  // riego tiene prioridad
  }

  return {
    percentage,
    stage,
    daysUntilHarvest,
    needsWatering,
    needsFertilizer,
    healthStatus,
    overWatered,
    overFertilized,
    overPruned,
  }
}

