import { Router } from 'express'
import { passport, remove } from '../controllers/plant.controller'
import { requireAuth } from '../middlewares/auth.middleware'

const router = Router()

// Pasaporte Vivo de una planta concreta
router.get('/:id/passport', requireAuth, passport)

// Desarraigar / eliminar una planta y liberar su parcela
router.delete('/:id', requireAuth, remove)

export default router
