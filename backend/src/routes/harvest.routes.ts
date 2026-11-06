// backend/src/routes/harvest.routes.ts
import { Router } from 'express'
import { harvestPlant, listByGarden, listByCommunity } from '../controllers/harvest.controller'
import { requireAuth } from '../middlewares/auth.middleware'
import { requireHarvestRole } from '../middlewares/harvestRole.middleware'

// Rutas para plantas: /api/plants/:id/harvest
export const plantHarvestRouter = Router({ mergeParams: true })
// Requiere rol RESPONSABLE o CUIDADOR (PARTICIPANTE obtiene 403)
plantHarvestRouter.post('/', requireAuth, requireHarvestRole, harvestPlant)

// Rutas para huertos: /api/gardens/:id/harvests
export const gardenHarvestRouter = Router({ mergeParams: true })
gardenHarvestRouter.get('/', requireAuth, listByGarden)

// Rutas para comunidades: /api/communities/:id/harvests
export const communityHarvestRouter = Router({ mergeParams: true })
communityHarvestRouter.get('/', requireAuth, listByCommunity)
