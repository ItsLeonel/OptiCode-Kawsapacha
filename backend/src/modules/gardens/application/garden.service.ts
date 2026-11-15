// backend/src/modules/gardens/application/garden.service.ts
import type { GardenRepository, GardenPhotoStorage, UploadedPhoto } from './ports/garden.repository'

export interface CreateGardenInput {
  name: string
  kind: string
  areaM2: number
  province: string
  provinceCode: string
  canton: string
  cantonCode: string | null
  parish: string
  parishCode: string | null
  reference: string
  latitude: number | null
  longitude: number | null
  irrigationAvailability: string
  soilType: string | null
  characteristics?: string | null
  communityId: string | null
  createdById: string
  file?: UploadedPhoto
  removePhoto?: boolean
}

export function createGardenService(repository: GardenRepository, photos: GardenPhotoStorage, isCommunityResponsable: (communityId: string, userId: string) => Promise<boolean>) {
async function requireTargetCommunity(communityId: string | null | undefined, userId: string) {
  if (communityId && !await isCommunityResponsable(communityId, userId)) {
    throw Object.assign(new Error('Solo el Responsable puede registrar o vincular un huerto en esta comunidad.'), { code: 'FORBIDDEN' })
  }
}

async function requireGardenEditor(garden: { createdById: string; communityId: string | null }, userId: string) {
  if (garden.createdById !== userId && !(garden.communityId && await isCommunityResponsable(garden.communityId, userId))) {
    throw Object.assign(new Error('Solo el Responsable o creador del huerto puede modificar su configuración.'), { code: 'FORBIDDEN' })
  }
}

async function createGarden(input: CreateGardenInput) {
  await requireTargetCommunity(input.communityId, input.createdById)
  // Si se especifica comunidad, buscar primero si la comunidad ya tiene un huerto
  let existingGarden = null
  if (input.communityId) {
    existingGarden = await repository.findLatestByCommunity(input.communityId)
  }

  // Si no se encontró por comunidad, buscar si el usuario ya creó un huerto
  if (!existingGarden) {
    existingGarden = await repository.findLatestByCreator(input.createdById)
  }

  if (existingGarden) {
    await requireGardenEditor(existingGarden, input.createdById)
    return photos.withPhoto( input.file, input.removePhoto, existingGarden.photoUrl, photoUrl => repository.update(existingGarden.id, {
        name: input.name,
        kind: input.kind,
        areaM2: input.areaM2,
        province: input.province,
        provinceCode: input.provinceCode,
        canton: input.canton,
        cantonCode: input.cantonCode,
        parish: input.parish,
        parishCode: input.parishCode,
        reference: input.reference,
        latitude: input.latitude,
        longitude: input.longitude,
        irrigationAvailability: input.irrigationAvailability,
        soilType: input.soilType,
        characteristics: input.characteristics !== undefined ? input.characteristics : existingGarden.characteristics,
        communityId: input.communityId ?? existingGarden.communityId,
        photoUrl,
    }))
  }

  return photos.withPhoto( input.file, false, null, photoUrl => repository.create({
      name: input.name,
      kind: input.kind,
      areaM2: input.areaM2,
      province: input.province,
      provinceCode: input.provinceCode,
      canton: input.canton,
      cantonCode: input.cantonCode,
      parish: input.parish,
      parishCode: input.parishCode,
      reference: input.reference,
      latitude: input.latitude,
      longitude: input.longitude,
      irrigationAvailability: input.irrigationAvailability,
      soilType: input.soilType,
      characteristics: input.characteristics ?? null,
      communityId: input.communityId,
      createdById: input.createdById,
      photoUrl,
  }))
}

/**
 * Devuelve únicamente los huertos que:
 *   - Fueron creados por el usuario (createdById === userId), O
 *   - Pertenecen a una comunidad donde el usuario es miembro ACCEPTED.
 * Si se pasa communityId filtra adicionalmente por esa comunidad.
 */
async function listGardens(userId: string, communityId?: string) {
  return repository.listAccessible(userId, communityId)
}

async function getGardenById(id: string) {
  return repository.getDetails(id)
}

async function updateGarden(id: string, userId: string, data: Partial<Omit<CreateGardenInput, 'createdById'>>) {
  const garden = await repository.findById(id)
  if (!garden) throw new Error('Huerto no encontrado')

  await requireGardenEditor(garden, userId)
  if (data.communityId !== garden.communityId) await requireTargetCommunity(data.communityId, userId)
  const { file, removePhoto, ...fields } = data
  return photos.withPhoto( file, removePhoto, garden.photoUrl, photoUrl =>
    repository.update(id, { ...fields, photoUrl }))
}

return { createGarden, listGardens, getGardenById, updateGarden }
}
