import { Router } from 'express'
import gardenRoutes from '../modules/gardens/presentation/garden.routes'
import gardenPlantRoutes from '../modules/plants/presentation/garden-plant.routes'

/** Composición HTTP: ningún módulo de dominio conoce el controlador del otro. */
const router = Router()
router.use('/', gardenRoutes)
router.use('/', gardenPlantRoutes)
export default router
