import { Router } from 'express'
import { lookupUser } from '../controllers/user.controller'
import { requireAuth } from '../middlewares/auth.middleware'

const router = Router()

router.get('/lookup', requireAuth, lookupUser)

export default router
