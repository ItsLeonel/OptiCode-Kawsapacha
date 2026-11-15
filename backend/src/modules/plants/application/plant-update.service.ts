import { prisma } from '../../../infrastructure/database/prisma'
import path from 'path'
import { assertGardenAccess } from '../../activities/application/activity-access.service'
import { evaluateActivityReward } from '../../rewards/application/rewards.service'
import { syncUserMissionsAndBadges } from '../../rewards/application/missions.service'
import { extractGrowthStage } from '../domain/plant-rules'
import type { UpdatePlantInput } from './plant-input'

export async function updatePlantDetails(input: UpdatePlantInput) {
  const plant = await prisma.cultivatedPlant.findUnique({
    where: { id: input.plantId },
    include: { realGarden: true, species: true },
  })
  if (!plant) throw Object.assign(new Error('Planta no encontrada.'), { code: 'NOT_FOUND' })
  await assertGardenAccess(plant.realGardenId, input.requestingUserId)
  // La planta ya sembrada puede editarse y documentar fotos nuevas aunque MSP aún revise la siembra.

  // La etapa y el estado observados no pueden evolucionar sin evidencia fotográfica nueva.
  // No se bloquea una edición de nombre o notas que conserve la misma etapa.
  if (!input.file) {
    if (input.observedState && input.observedState !== plant.observedState) {
      throw Object.assign(new Error('Adjunta una fotografía real para cambiar el estado observado.'), { code: 'EVIDENCE_REQUIRED' })
    }
    if (input.growthStage) {
      const tracked = await prisma.gardenActivity.findMany({
        where: { plantId: plant.id, voidedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { details: true, type: true, reviewStatus: true },
      })
      const currentStage = extractGrowthStage(tracked)
      if (input.growthStage !== currentStage) {
        throw Object.assign(new Error('Adjunta una fotografía real para documentar una nueva etapa de crecimiento.'), { code: 'EVIDENCE_REQUIRED' })
      }
    }
  }

  const data: Record<string, any> = {}
  if (input.customName !== undefined && input.customName.trim() !== '') {
    data.customName = input.customName.trim()
  }
  if (input.notes !== undefined) {
    data.notes = input.notes.trim()
  }
  if (input.observedState !== undefined && input.observedState.trim() !== '') {
    data.observedState = input.observedState.trim()
    if (input.observedState === 'harvested') {
      data.lifecycleStatus = 'HARVESTED'
    } else if (['flowering', 'mature'].includes(input.observedState)) {
      data.lifecycleStatus = 'READY_TO_HARVEST'
    } else if (['germinated', 'growing'].includes(input.observedState)) {
      data.lifecycleStatus = 'GROWING'
    }
  }
  if (input.plantingDate) {
    const d = new Date(input.plantingDate)
    if (!isNaN(d.getTime())) {
      data.plantingDate = d
    }
  }
  if (input.plotIndex !== undefined && Number.isInteger(input.plotIndex) && input.plotIndex >= 0 && input.plotIndex <= 5 && input.plotIndex !== plant.plotIndex) {
    const existing = await prisma.cultivatedPlant.findUnique({
      where: { realGardenId_plotIndex: { realGardenId: plant.realGardenId, plotIndex: input.plotIndex } },
    })
    if (existing && existing.id !== plant.id) {
      throw Object.assign(new Error('Esa parcela ya está ocupada por otra planta.'), { code: 'PLOT_OCCUPIED' })
    }
    data.plotIndex = input.plotIndex
  }
  if (input.file) {
    const filename = path.basename(input.file.path)
    data.photoUrl = `/uploads/plants/${filename}`
    data.photoPath = input.file.path
    data.photoMime = input.file.mimetype
    data.photoSize = input.file.size
  }

  const updated = await prisma.cultivatedPlant.update({
    where: { id: input.plantId },
    data,
    include: { species: true, realGarden: { select: { id: true, name: true, province: true } } },
  })

  // Documentar observaciones reales como actividades válidas y recompensables.
  const hasObservation = Boolean(
    input.file || input.heightCm !== undefined ||
    (input.observedState && input.observedState !== plant.observedState) ||
    (input.notes !== undefined && input.notes.trim() !== plant.notes.trim()) ||
    (input.growthStage && input.file)
  )
  if (hasObservation) try {
    const today = new Date().toISOString().split('T')[0]
    const detailsObj: Record<string, any> = {}
    if (input.observedState) detailsObj.state = input.observedState
    if (input.growthStage) detailsObj.growthStage = input.growthStage
    if (input.heightCm !== undefined) detailsObj.heightCm = input.heightCm

    const activity = await prisma.gardenActivity.create({
      data: {
        gardenId: plant.realGardenId,
        actorUserId: input.requestingUserId,
        type: 'observation',
        performedDate: today,
        targetKind: 'plant',
        plantId: plant.id,
        plotIndex: updated.plotIndex,
        notes: input.notes || `Observación actualizada: ${input.observedState || 'seguimiento'}`,
        details: JSON.stringify(detailsObj),
        reviewStatus: 'APPROVED',
      },
    })

    if (input.file) {
      await prisma.activityEvidence.create({
        data: {
          activityId: activity.id,
          filePath: input.file.path,
          fileUrl: updated.photoUrl,
          mimeType: input.file.mimetype,
          fileSize: input.file.size,
        },
      })
    }

    await evaluateActivityReward({
      id: activity.id,
      actorUserId: input.requestingUserId,
      type: 'observation',
      performedDate: today,
      targetKind: 'plant',
      plantId: plant.id,
      plotIndex: updated.plotIndex,
    })
    await syncUserMissionsAndBadges(input.requestingUserId)
  } catch (actErr) {
    console.error('Error al registrar actividad automática de observación:', actErr)
  }

  return {
    ...updated,
    ...(input.growthStage ? { growthStage: input.growthStage } : {}),
  }
}
