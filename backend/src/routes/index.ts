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
import lunarCalendarRoutes from './lunar-calendar.routes'
import activityRoutes from './activity.routes'
import rewardsRoutes from './rewards.routes'
import { plantHarvestRouter, gardenHarvestRouter, communityHarvestRouter } from './harvest.routes'
import adminRoutes from './admin.routes'
import notificationRoutes from './notification.routes'
import { getCalendarTips } from '../controllers/care.controller'
import { requireAuth } from '../middlewares/auth.middleware'

const router = Router()

router.use('/auth', authRoutes)
// Paneles administrativos (ADMIN_TECNICO / ADMIN_MSP) y notificaciones de usuario
router.use('/admin', adminRoutes)
router.use('/notifications', notificationRoutes)
router.use('/lunar-calendar', lunarCalendarRoutes)
router.use('/users/me/invitations', invitationRoutes)
router.use('/users/me', rewardsRoutes)
router.use('/users', userRoutes)
router.use('/communities', communityRoutes)
router.use('/communities/:id/members', memberRoutes)
router.use('/communities/:id/resources', resourceRoutes)
router.use('/communities/:id/harvests', communityHarvestRouter)
router.use('/invitations', invitationRoutes)
router.use('/gardens', gardenRoutes)
router.use('/gardens/:gardenId/activities', activityRoutes)
router.use('/gardens/:id/harvests', gardenHarvestRouter)
router.use('/catalog', catalogRoutes)
router.use('/plants', plantRoutes)
router.use('/plants/:id/care', careRoutes)
router.use('/plants/:id/harvest', plantHarvestRouter)
// Calendario de siembra por especie (preservado)
router.get('/catalog/:id/calendar', requireAuth, getCalendarTips)

export default router
