// backend/src/routes/member.routes.ts
import { Router } from 'express'
import { invite, list, updateRole, remove } from '../controllers/member.controller'
import { requireAuth } from '../middlewares/auth.middleware'

const router = Router({ mergeParams: true })

router.get('/', requireAuth, list)
router.post('/invite', requireAuth, invite)
router.patch('/:userId/role', requireAuth, updateRole)
router.delete('/:userId', requireAuth, remove)

export default router
