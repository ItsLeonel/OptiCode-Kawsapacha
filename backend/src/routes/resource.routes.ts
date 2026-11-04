// backend/src/routes/resource.routes.ts
import { Router } from 'express'
import { list, create, update, remove } from '../controllers/resource.controller'
import { requireAuth } from '../middlewares/auth.middleware'

const router = Router({ mergeParams: true })

router.get('/', requireAuth, list)
router.post('/', requireAuth, create)
router.patch('/:resourceId', requireAuth, update)
router.delete('/:resourceId', requireAuth, remove)

export default router
