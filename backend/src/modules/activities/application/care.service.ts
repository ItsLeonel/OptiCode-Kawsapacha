// backend/src/modules/activities/application/care.service.ts
import { prisma } from '../../../infrastructure/database/prisma'

import { calculateGrowthData, type Species, type CareLogEntry } from '../domain/care-rules'
export type { HealthStatus } from '../domain/care-rules'

// ─── Validación previa al registro de cuidado ─────────────────────────────────

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
    include: {
      species: true,
      careLogs: {
        include: {
          activities: { select: { id: true, reviewStatus: true, voidedAt: true } },
        },
      },
    },
  })
  if (freshPlant && freshPlant.lifecycleStatus !== 'HARVESTED') {
    const effectiveCareLogs = freshPlant.careLogs.filter(cl => {
      if (!cl.activities || cl.activities.length === 0) return true
      return cl.activities.some(a => a.reviewStatus !== 'REJECTED' && !a.voidedAt)
    })
    const growth = calculateGrowthData(freshPlant, freshPlant.species, effectiveCareLogs)
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
    include: {
      species: true,
      careLogs: {
        include: {
          activities: { select: { id: true, reviewStatus: true, voidedAt: true } },
        },
      },
    },
  })
  if (!plant) throw new Error('Planta no encontrada')

  const effectiveCareLogs = plant.careLogs.filter(cl => {
    if (!cl.activities || cl.activities.length === 0) return true
    return cl.activities.some(a => a.reviewStatus !== 'REJECTED' && !a.voidedAt)
  })

  return {
    ...calculateGrowthData(plant, plant.species, effectiveCareLogs),
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
