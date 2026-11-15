// backend/src/routes/notification.routes.ts
import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.middleware'
import {
  getNotifications,
  markRead,
  markAllRead,
  clearRead,
} from '../controllers/notification.controller'

const router = Router()

router.use(requireAuth)

router.get('/', getNotifications)
router.patch('/read-all', markAllRead)
router.delete('/read', clearRead)
router.patch('/:id/read', markRead)

export default router
