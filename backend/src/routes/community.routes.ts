import { Router } from 'express'
import { create, list, getById, update } from '../controllers/community.controller'
import { requireAuth } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', requireAuth, list)
router.post('/', requireAuth, create)
router.get('/:id', requireAuth, getById)
router.put('/:id', requireAuth, update)

export default router

