// backend/src/modules/communities/presentation/invitation.routes.ts
import { Router } from 'express'
import { requireAuth } from '../../../shared/middlewares/auth.middleware'
import { getMyInvitations, accept, reject } from './invitation.controller'

const router = Router()

router.get('/me', requireAuth, getMyInvitations)
router.get('/', requireAuth, getMyInvitations)
router.post('/:id/accept', requireAuth, accept)
router.post('/:id/reject', requireAuth, reject)

export default router

