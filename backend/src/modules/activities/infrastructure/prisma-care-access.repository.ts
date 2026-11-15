import { prisma } from '../../../infrastructure/database/prisma'
import type { CareAccessRepository } from '../application/ports/care-access.repository'

export const prismaCareAccessRepository: CareAccessRepository = {
  async findGardenIdByPlant(plantId) {
    const plant = await prisma.cultivatedPlant.findUnique({
      where: { id: plantId }, select: { realGardenId: true },
    })
    return plant?.realGardenId ?? null
  },
}
