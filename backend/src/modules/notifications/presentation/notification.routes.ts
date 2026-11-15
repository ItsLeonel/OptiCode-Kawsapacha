// backend/src/modules/notifications/presentation/notification.routes.ts
import { Router } from 'express'
import { requireAuth } from '../../../shared/middlewares/auth.middleware'
import {
  getNotifications,
  markRead,
  markAllRead,
  clearRead,
} from './notification.controller'

const router = Router()

router.use(requireAuth)

router.get('/', getNotifications)
router.patch('/read-all', markAllRead)
router.delete('/read', clearRead)
router.patch('/:id/read', markRead)

export default router
