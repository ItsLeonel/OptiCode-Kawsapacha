// backend/src/routes/invitation.routes.ts
import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.middleware'
import { getMyInvitations, accept, reject } from '../controllers/invitation.controller'

const router = Router()

router.get('/me', requireAuth, getMyInvitations)
router.get('/', requireAuth, getMyInvitations)
router.post('/:id/accept', requireAuth, accept)
router.post('/:id/reject', requireAuth, reject)

export default router

