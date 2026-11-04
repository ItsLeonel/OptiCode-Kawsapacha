import { prisma } from '../config/prisma'
import path from 'path'

const MAX_PLOTS = 6

export interface RegisterPlantInput {
  realGardenId: string
  speciesId: string
  plotIndex: number
  customName: string
  notes: string
  registeredById: string
  file: Express.Multer.File
}

export async function registerPlant(input: RegisterPlantInput) {
  // Validar rango de parcela
  if (input.plotIndex < 0 || input.plotIndex >= MAX_PLOTS) {
    throw Object.assign(new Error(`La parcela debe estar entre 0 y ${MAX_PLOTS - 1}.`), { code: 'INVALID_PLOT' })
  }

  // Verificar que la parcela esté libre
  const existing = await prisma.cultivatedPlant.findUnique({
    where: { realGardenId_plotIndex: { realGardenId: input.realGardenId, plotIndex: input.plotIndex } },
  })
  if (existing) {
    throw Object.assign(new Error('Esa parcela ya está ocupada. Elige otra.'), { code: 'PLOT_OCCUPIED' })
  }

  // Verificar que el huerto existe
  const garden = await prisma.realGarden.findUnique({ where: { id: input.realGardenId } })
  if (!garden) throw Object.assign(new Error('El huerto no existe.'), { code: 'GARDEN_NOT_FOUND' })

  // Verificar que la especie existe
  const species = await prisma.medicinalCatalog.findUnique({ where: { id: input.speciesId } })
  if (!species) throw Object.assign(new Error('La especie no está en el catálogo.'), { code: 'SPECIES_NOT_FOUND' })

  // Construir URL pública de la foto
  const filename = path.basename(input.file.path)
  const photoUrl = `/uploads/plants/${filename}`

  return prisma.cultivatedPlant.create({
    data: {
      realGardenId: input.realGardenId,
      speciesId: input.speciesId,
      plotIndex: input.plotIndex,
      customName: input.customName,
      notes: input.notes,
      registeredById: input.registeredById,
      photoUrl,
      photoPath: input.file.path,
      photoMime: input.file.mimetype,
      photoSize: input.file.size,
    },
    include: { species: true, realGarden: { select: { id: true, name: true, province: true } } },
  })
}

export async function listPlantsByGarden(gardenId: string) {
  return prisma.cultivatedPlant.findMany({
    where: { realGardenId: gardenId },
    include: { species: true },
    orderBy: { plotIndex: 'asc' },
  })
}

export async function getPlantPassport(plantId: string) {
  return prisma.cultivatedPlant.findUnique({
    where: { id: plantId },
    include: {
      species: true,
      realGarden: {
        select: {
          id: true, name: true, province: true, canton: true, parish: true,
          latitude: true, longitude: true,
        },
      },
      registeredBy: { select: { id: true, name: true } },
    },
  })
}

