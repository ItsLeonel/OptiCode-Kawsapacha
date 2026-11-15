// backend/src/modules/rewards/presentation/rewards.routes.ts
import { Router } from 'express'
import { requireAuth } from '../../../shared/middlewares/auth.middleware'
import { getMyRewards } from './rewards.controller'

const router = Router()

// Consulta protegida de Semillas de vida, misiones e insignias del usuario
router.get('/rewards', requireAuth, getMyRewards)

export default router

