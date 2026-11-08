// backend/src/services/care.service.ts
import { prisma } from '../config/prisma'

// ─── Días de rebrote por especie (catálogo botánico andino) ───────────────────
// Menta / Hierbabuena: 14-18 días | Manzanilla: 12-15 | Llantén: 12-16
// Toronjil: 18-22 | Orégano: 20-25 | Romero / Lavanda: 25-35 | Fallback: 20
function getRegrowthDaysByName(speciesName: string): number {
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

type Species = {
  name: string
  wateringFrequencyDays: number
  fertilizerFrequencyDays: number
  growthCycleDays: number
  lunarPhaseTip: string
  bestPlantingSeason: string
}

type CareLogEntry = {
  actionType: string
  performedAt: Date
}

type PlantData = {
  plantingDate: Date
  lifecycleStatus: string
  lastHarvestDate?: Date | null
}

// ─── Lógica de crecimiento y salud ───────────────────────────────────────────

function calculateGrowthData(
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

  // Exceso: más de 2 riegos en 24 h, más de 1 abono en 24 h, más de 2 podas en una semana
  const overWatered = wateringsLast24h > 2
  const overFertilized = fertilizersLast24h > 1
  const overPruned = pruningsLastWeek > 2

  // ── Determinar estado de salud ────────────────────────────────────────────
  let healthStatus: HealthStatus = 'VIGOROSA'
  if (overWatered) healthStatus = 'EXCESO_AGUA'
  else if (overFertilized) healthStatus = 'EXCESO_ABONO'
  else if (overPruned) healthStatus = 'ESTRES_PODA'

  // ── Calcular porcentaje base ──────────────────────────────────────────────
  // Si hay estrés (sobrecuidado), congelar avance. Si no, calcular normalmente.
  const hasStress = overWatered || overFertilized || overPruned
  let percentage = hasStress ? 0 : Math.min(100, (daysElapsed / cycleDays) * 100)

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

  // En rebrote: porcentaje parte de 25% (planta sigue viva) y crece hasta 100%
  if (isRegrowing) {
    const regrowthPct = Math.min(100, (daysElapsed / regrowthDays) * 75) // 25% → 100%
    percentage = hasStress ? 25 : Math.min(100, 25 + regrowthPct)
  }

  percentage = Math.round(percentage)

  // ── Etapa de crecimiento ──────────────────────────────────────────────────
  let stage: string
  if (isRegrowing) {
    if (percentage < 50) stage = 'Rebrote y recuperación 🌱'
    else if (percentage < 75) stage = 'Crecimiento de rebrote 🌿'
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

// ─── Validación previa al registro de cuidado ─────────────────────────────────

async function validateCareAction(
  plantId: string,
  actionType: string,
  plant: { lifecycleStatus: string; species: Species; careLogs: CareLogEntry[] }
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
    if (pruningsLastWeek >= 2) {
      return {
        allowed: false,
        warningMessage: '⚠️ Poda excesiva esta semana: la planta necesita tiempo para recuperarse del estrés por poda.',
      }
    }
  }

  return { allowed: true, warningMessage: '' }
}

// ─── API pública del servicio ─────────────────────────────────────────────────

export async function addCareLog(
  plantId: string,
  actionType: string,
  notes: string,
  userId: string
) {
  // Cargar planta con especie y logs para validar
  const plantForValidation = await prisma.cultivatedPlant.findUnique({
    where: { id: plantId },
    include: { species: true, careLogs: true },
  })
  if (!plantForValidation) throw new Error('Planta no encontrada')

  const { allowed, warningMessage } = await validateCareAction(plantId, actionType, {
    lifecycleStatus: plantForValidation.lifecycleStatus,
    species: plantForValidation.species,
    careLogs: plantForValidation.careLogs,
  })

  if (!allowed) {
    throw Object.assign(new Error(warningMessage), { code: 'CARE_OVERUSE' })
  }

  const log = await prisma.careLog.create({
    data: { plantId, actionType, notes, userId },
  })

  // Recalcular estado del ciclo de vida
  const freshPlant = await prisma.cultivatedPlant.findUnique({
    where: { id: plantId },
    include: { species: true, careLogs: true },
  })
  if (freshPlant && freshPlant.lifecycleStatus !== 'HARVESTED') {
    const growth = calculateGrowthData(freshPlant, freshPlant.species, freshPlant.careLogs)
    if (growth.percentage >= 76 && freshPlant.lifecycleStatus !== 'REGROWING') {
      await prisma.cultivatedPlant.update({
        where: { id: plantId },
        data: { lifecycleStatus: 'READY_TO_HARVEST' },
      })
    } else if (growth.percentage >= 76 && freshPlant.lifecycleStatus === 'REGROWING') {
      // Cuando el rebrote alcanza madurez, vuelve a READY_TO_HARVEST
      await prisma.cultivatedPlant.update({
        where: { id: plantId },
        data: { lifecycleStatus: 'READY_TO_HARVEST' },
      })
    }
  }

  return log
}

export async function getCareLogs(plantId: string) {
  return prisma.careLog.findMany({
    where: { plantId },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { performedAt: 'desc' },
  })
}

export async function calculateGrowth(plantId: string) {
  const plant = await prisma.cultivatedPlant.findUnique({
    where: { id: plantId },
    include: { species: true, careLogs: true },
  })
  if (!plant) throw new Error('Planta no encontrada')

  return {
    ...calculateGrowthData(plant, plant.species, plant.careLogs),
    lifecycleStatus: plant.lifecycleStatus,
    plantingDate: plant.plantingDate,
    lastHarvestDate: plant.lastHarvestDate,
  }
}

export async function getCalendarTips(speciesId: string) {
  const species = await prisma.medicinalCatalog.findUnique({
    where: { id: speciesId },
  })
  if (!species) throw new Error('Especie no encontrada')

  return {
    wateringFrequencyDays: species.wateringFrequencyDays,
    fertilizerFrequencyDays: species.fertilizerFrequencyDays,
    growthCycleDays: species.growthCycleDays,
    bestPlantingSeason: species.bestPlantingSeason,
    lunarPhaseTip: species.lunarPhaseTip,
  }
}
