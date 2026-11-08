import { Router } from 'express'
import { list, getById } from '../controllers/catalog.controller'

const router = Router()

// Catálogo es público (sin autenticación requerida para explorar)
router.get('/', list)
router.get('/:id', getById)

export default router

