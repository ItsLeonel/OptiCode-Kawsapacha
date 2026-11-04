// backend/src/services/care.service.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function addCareLog(
  plantId: string,
  actionType: string,
  notes: string,
  userId: string
) {
  const log = await prisma.careLog.create({
    data: { plantId, actionType, notes, userId },
  })

  // Recalcular si está lista para cosechar y actualizar lifecycleStatus
  const plant = await prisma.cultivatedPlant.findUnique({
    where: { id: plantId },
    include: { species: true, careLogs: true },
  })

  if (plant && plant.lifecycleStatus !== 'HARVESTED') {
    const growth = calculateGrowthData(plant, plant.species, plant.careLogs)
    if (growth.percentage >= 76) {
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

type Species = {
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
}

function calculateGrowthData(
  plant: PlantData,
  species: Species,
  careLogs: CareLogEntry[]
) {
  const now = new Date()
  const plantingDate = new Date(plant.plantingDate)
  const daysPlanted = Math.max(0, (now.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24))

  // Base: días transcurridos / ciclo total * 100
  let percentage = Math.min(100, (daysPlanted / species.growthCycleDays) * 100)

  // Bonus por riegos recientes
  const recentWaterings = careLogs.filter(l => {
    const daysSince = (now.getTime() - new Date(l.performedAt).getTime()) / (1000 * 60 * 60 * 24)
    return l.actionType === 'WATERING' && daysSince <= species.wateringFrequencyDays
  })
  percentage = Math.min(100, percentage + recentWaterings.length * 3)

  // Bonus por fertilizaciones recientes
  const recentFertilizer = careLogs.filter(l => {
    const daysSince = (now.getTime() - new Date(l.performedAt).getTime()) / (1000 * 60 * 60 * 24)
    return l.actionType === 'FERTILIZER' && daysSince <= species.fertilizerFrequencyDays
  })
  percentage = Math.min(100, percentage + recentFertilizer.length * 2)

  percentage = Math.round(percentage)

  // Etapa de crecimiento
  let stage: string
  if (percentage <= 25) stage = 'Semilla 🌱'
  else if (percentage <= 50) stage = 'Brote 🌿'
  else if (percentage <= 75) stage = 'Crecimiento 🪴'
  else stage = 'Lista para cosechar ✨'

  const daysUntilHarvest = Math.max(0, Math.round(species.growthCycleDays - daysPlanted))

  // Verificar si necesita riego
  const lastWatering = careLogs
    .filter(l => l.actionType === 'WATERING')
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())[0]
  const needsWatering = !lastWatering ||
    (now.getTime() - new Date(lastWatering.performedAt).getTime()) / (1000 * 60 * 60 * 24) >= species.wateringFrequencyDays

  // Verificar si necesita fertilizante
  const lastFertilizer = careLogs
    .filter(l => l.actionType === 'FERTILIZER')
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())[0]
  const needsFertilizer = !lastFertilizer ||
    (now.getTime() - new Date(lastFertilizer.performedAt).getTime()) / (1000 * 60 * 60 * 24) >= species.fertilizerFrequencyDays

  return { percentage, stage, daysUntilHarvest, needsWatering, needsFertilizer }
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

