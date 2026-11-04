import { Router } from 'express'
import authRoutes from './auth.routes'
import communityRoutes from './community.routes'
import gardenRoutes from './garden.routes'
import catalogRoutes from './catalog.routes'
import plantRoutes from './plant.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/communities', communityRoutes)
router.use('/gardens', gardenRoutes)
router.use('/catalog', catalogRoutes)
router.use('/plants', plantRoutes)

export default router

