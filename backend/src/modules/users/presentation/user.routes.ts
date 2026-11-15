import { Router } from 'express'
import { lookupUser } from './user.controller'
import { requireAuth } from '../../../shared/middlewares/auth.middleware'

const router = Router()

router.get('/lookup', requireAuth, lookupUser)

export default router
