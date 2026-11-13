import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env'
import { prisma } from './config/prisma'
import routes from './routes'
import { errorMiddleware } from './middlewares/error.middleware'
import { uploadsRoot } from './services/entity-photo.service'

const app = express()

// ─── Middlewares globales ────────────────────────────────────────────────────
// Helmet relajado para acceso en red local (demos, presentaciones)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// CORS dinámico: acepta localhost y cualquier IP privada de red local
const ALLOWED_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/
app.use(cors({
  origin: (origin, callback) => {
    // Sin origen (curl, Postman, same-origin) → permitir
    if (!origin) return callback(null, true)
    if (ALLOWED_ORIGIN_PATTERN.test(origin)) return callback(null, true)
    callback(new Error(`CORS bloqueado para origen: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Archivos estáticos (fotos de plantas) ───────────────────────────────────
app.use('/uploads', express.static(uploadsRoot))

// ─── Healthcheck ─────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', service: 'kawsapacha-backend', db: 'connected', timestamp: new Date().toISOString() })
  } catch {
    res.status(503).json({ status: 'error', service: 'kawsapacha-backend', db: 'disconnected', timestamp: new Date().toISOString() })
  }
})

// ─── Rutas de la API ─────────────────────────────────────────────────────────
app.use('/api', routes)

// ─── Ruta no encontrada ───────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Ruta no encontrada.' } })
})

// ─── Manejo de errores ───────────────────────────────────────────────────────
app.use(errorMiddleware)

// ─── Inicio del servidor ──────────────────────────────────────────────────────
if (require.main === module) app.listen(env.port, () => {
  console.log(`\n🌱 Kawsapacha Backend corriendo en http://localhost:${env.port}`)
  console.log(`   Healthcheck: http://localhost:${env.port}/api/health\n`)
})

export default app

