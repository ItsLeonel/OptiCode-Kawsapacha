import { Router } from 'express'
import { register as registerPlant, listByGarden } from './plant.controller'
import { requireAuth } from '../../../shared/middlewares/auth.middleware'
import { uploadPlantPhoto } from '../../../shared/middlewares/upload.middleware'

/** Endpoints de plantas anidados bajo /gardens, conservando la API original. */
const router = Router()
router.get('/:gardenId/plants', requireAuth, listByGarden)
router.post('/:gardenId/plants', requireAuth, uploadPlantPhoto, registerPlant)
export default router
