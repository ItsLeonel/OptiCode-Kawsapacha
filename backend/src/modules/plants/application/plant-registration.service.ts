import type { PlantWriteRepository, PlantWriteServices } from './ports/plant-write.repository'
import { MAX_PLOTS } from '../domain/plant-rules'
import type { RegisterPlantInput } from './plant-input'

export function createPlantRegistrationService<T extends {id:string}, U extends {plotIndex:number|null;photoUrl:string|null}>(repository:PlantWriteRepository<T,U>, services:PlantWriteServices) {
const { assertGardenAccess, evaluateActivityReward, syncUserMissionsAndBadges, basename } = services
async function registerPlant(input: RegisterPlantInput) {
  // La autenticación no garantiza pertenencia: impedir siembra sobre huertos ajenos.
  await assertGardenAccess(input.realGardenId, input.registeredById)
  // Validar rango de parcela
  if (input.plotIndex < 0 || input.plotIndex >= MAX_PLOTS) {
    throw Object.assign(new Error(`La parcela debe estar entre 0 y ${MAX_PLOTS - 1}.`), { code: 'INVALID_PLOT' })
  }

  // Verificar que la parcela esté libre (si estaba cosechada/archivada/removida, liberar la parcela)
  const existing = await repository.findPlot(input.realGardenId, input.plotIndex)
  if (existing) {
    if (existing.lifecycleStatus === 'HARVESTED') {
      // Liberar la parcela sin destruir la historia fotográfica, cosecha ni cuidados.
      await repository.archiveHarvested(existing.id)
    } else if (existing.reviewStatus === 'PENDING' || existing.reviewStatus === 'NEEDS_CHANGES') {
      throw Object.assign(
        new Error(
          `El Espacio ${input.plotIndex + 1} ya tiene sembrada la planta «${existing.customName || 'sin nombre'}». Puedes registrar sus cuidados mientras el MSP revisa su evidencia, pero no sembrar otra planta en esa parcela.`
        ),
        { code: 'PLOT_OCCUPIED' }
      )
    } else {
      throw Object.assign(
        new Error(`El Espacio ${input.plotIndex + 1} ya está ocupado. Elige otro espacio disponible.`),
        { code: 'PLOT_OCCUPIED' }
      )
    }
  }

  // assertGardenAccess ya verificó existencia y permisos; PENDING no bloquea siembra.

  // Verificar que la especie existe
  const species = await repository.findSpecies(input.speciesId)
  if (!species) throw Object.assign(new Error('La especie no está en el catálogo.'), { code: 'SPECIES_NOT_FOUND' })

  // Construir URL pública de la foto
  const filename = basename(input.file.path)
  const photoUrl = `/uploads/plants/${filename}`

  const parsedPlantingDate = input.plantedOn && /^\d{4}-\d{2}-\d{2}$/.test(input.plantedOn)
    ? new Date(input.plantedOn + 'T12:00:00.000Z')
    : undefined

  const createdPlant = await repository.createPlant({
      realGardenId: input.realGardenId,
      speciesId: input.speciesId,
      plotIndex: input.plotIndex,
      customName: input.customName,
      notes: input.notes,
      ...(parsedPlantingDate && !isNaN(parsedPlantingDate.getTime()) ? { plantingDate: parsedPlantingDate } : {}),
      registeredById: input.registeredById,
      photoUrl,
      photoPath: input.file.path,
      photoMime: input.file.mimetype,
      photoSize: input.file.size,
      reviewStatus: 'APPROVED', // Registro válido automáticamente; auditoría MSP opcional.
  })

  // Registrar automáticamente la actividad de siembra en la Bitácora Viva con evidencia y recompensas
  try {
    const performedDate = input.plantedOn && /^\d{4}-\d{2}-\d{2}$/.test(input.plantedOn)
      ? input.plantedOn
      : new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const sowingDetails: Record<string, unknown> = {
      speciesName: species.name,
      customName: input.customName,
    }
    if (input.growthStage) {
      sowingDetails['growthStage'] = input.growthStage
    }
    const sowingActivity = await repository.createActivity({
        gardenId: input.realGardenId,
        actorUserId: input.registeredById,
        type: 'sowing',
        performedDate,
        targetKind: 'plant',
        plantId: createdPlant.id,
        plotIndex: input.plotIndex,
        notes: input.notes || `Siembra documentada de ${species.name}`,
        details: JSON.stringify(sowingDetails),
        reviewStatus: 'APPROVED',
    })

    if (input.file) {
      await repository.createEvidence({
          activityId: sowingActivity.id,
          filePath: input.file.path,
          fileUrl: photoUrl,
          mimeType: input.file.mimetype,
          fileSize: input.file.size,
      })
    }

    // Siembra válida desde el inicio: los puntos se acreditan inmediatamente.
    await evaluateActivityReward({
      id: sowingActivity.id,
      actorUserId: input.registeredById,
      type: 'sowing',
      performedDate,
      targetKind: 'plant',
      plantId: createdPlant.id,
      plotIndex: input.plotIndex,
    })
    await syncUserMissionsAndBadges(input.registeredById)
  } catch (actErr) {
    console.error('Error al registrar actividad automática de siembra en Bitácora:', actErr)
  }

  return {
    ...createdPlant,
    growthStage: input.growthStage || undefined,
  }
}

return {registerPlant}
}
