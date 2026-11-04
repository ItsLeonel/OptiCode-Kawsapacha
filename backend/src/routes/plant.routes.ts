import { Router } from 'express'
import { passport } from '../controllers/plant.controller'
import { requireAuth } from '../middlewares/auth.middleware'

const router = Router()

// Pasaporte Vivo de una planta concreta
router.get('/:id/passport', requireAuth, passport)

export default router

