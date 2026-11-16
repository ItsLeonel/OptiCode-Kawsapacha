import { Router } from 'express'
import authRoutes from '../modules/auth/presentation/auth.routes'
import communityRoutes from '../modules/communities/presentation/community.routes'
import gardenRoutes from './garden-router'
import catalogRoutes from '../modules/catalog/presentation/catalog.routes'
import plantRoutes from '../modules/plants/presentation/plant.routes'
import memberRoutes from '../modules/communities/presentation/member.routes'
import careRoutes from '../modules/activities/presentation/care.routes'
import resourceRoutes from '../modules/harvest/presentation/resource.routes'
import invitationRoutes from '../modules/communities/presentation/invitation.routes'
import userRoutes from '../modules/users/presentation/user.routes'
import lunarCalendarRoutes from '../modules/lunar-calendar/presentation/lunar-calendar.routes'
import activityRoutes from '../modules/activities/presentation/activity.routes'
import rewardsRoutes from '../modules/rewards/presentation/rewards.routes'
import { plantHarvestRouter, gardenHarvestRouter, communityHarvestRouter } from '../modules/harvest/presentation/harvest.routes'
import adminRoutes from '../modules/administration/presentation/admin.routes'
import notificationRoutes from '../modules/notifications/presentation/notification.routes'
import { getCalendarTips } from '../modules/activities/presentation/care.controller'
import { requireAuth } from '../shared/middlewares/auth.middleware'

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
