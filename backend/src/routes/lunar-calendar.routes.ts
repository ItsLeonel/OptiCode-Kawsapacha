// backend/src/routes/lunar-calendar.routes.ts
import { Router } from 'express'
import { getLunarCalendar } from '../controllers/lunar-calendar.controller'

const router = Router()

// Consulta pública o autenticada de fases lunares y recomendaciones MSP
router.get('/', getLunarCalendar)

export default router

