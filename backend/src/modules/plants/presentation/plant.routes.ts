import { Router } from 'express'
import { passport, remove, archive, update } from './plant.controller'
import { requireAuth } from '../../../shared/middlewares/auth.middleware'
import { uploadPlantPhoto } from '../../../shared/middlewares/upload.middleware'

const router = Router()

// Pasaporte Vivo de una planta concreta
router.get('/:id/passport', requireAuth, passport)

// Actualizar ficha, observaciones, estado y foto de la planta
router.patch('/:id', requireAuth, uploadPlantPhoto, update)

// Archivar planta (conserva datos, libera parcela)
router.patch('/:id/archive', requireAuth, archive)

// Desarraigar / eliminar una planta y liberar su parcela
router.delete('/:id', requireAuth, remove)

export default router
