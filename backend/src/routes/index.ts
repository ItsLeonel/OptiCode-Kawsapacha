import { Router } from 'express'
import authRoutes from './auth.routes'
import communityRoutes from './community.routes'
import gardenRoutes from './garden.routes'
import catalogRoutes from './catalog.routes'
import plantRoutes from './plant.routes'
import memberRoutes from './member.routes'
import careRoutes from './care.routes'
import resourceRoutes from './resource.routes'
import invitationRoutes from './invitation.routes'
import userRoutes from './user.routes'
import { plantHarvestRouter, gardenHarvestRouter, communityHarvestRouter } from './harvest.routes'
import { getCalendarTips } from '../controllers/care.controller'
import { requireAuth } from '../middlewares/auth.middleware'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users/me/invitations', invitationRoutes)
router.use('/users', userRoutes)
router.use('/communities', communityRoutes)
router.use('/communities/:id/members', memberRoutes)
router.use('/communities/:id/resources', resourceRoutes)
router.use('/communities/:id/harvests', communityHarvestRouter)
router.use('/invitations', invitationRoutes)
router.use('/users/me/invitations', invitationRoutes)
router.use('/gardens', gardenRoutes)
router.use('/gardens/:id/harvests', gardenHarvestRouter)
router.use('/catalog', catalogRoutes)
router.use('/plants', plantRoutes)
router.use('/plants/:id/care', careRoutes)
router.use('/plants/:id/harvest', plantHarvestRouter)
// Calendario de siembra por especie
router.get('/catalog/:id/calendar', requireAuth, getCalendarTips)

export default router
