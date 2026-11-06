// backend/src/routes/care.routes.ts
import { Router } from 'express'
import { addCare, getCare, getGrowth } from '../controllers/care.controller'
import { requireAuth } from '../middlewares/auth.middleware'

const router = Router({ mergeParams: true })

router.get('/', requireAuth, getCare)
router.post('/', requireAuth, addCare)
router.get('/growth', requireAuth, getGrowth)

export default router
