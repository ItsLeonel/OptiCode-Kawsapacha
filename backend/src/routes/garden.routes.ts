import { Router } from 'express'
import { create, list, getById } from '../controllers/garden.controller'
import { register as registerPlant, listByGarden } from '../controllers/plant.controller'
import { requireAuth } from '../middlewares/auth.middleware'
import { uploadPlantPhoto } from '../middlewares/upload.middleware'

const router = Router()

router.get('/', requireAuth, list)
router.post('/', requireAuth, create)
router.get('/:id', requireAuth, getById)

// Plantas del huerto virtual (anidadas bajo el huerto)
router.get('/:gardenId/plants', requireAuth, listByGarden)
router.post('/:gardenId/plants', requireAuth, uploadPlantPhoto, registerPlant)

export default router

