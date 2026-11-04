import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { env } from './config/env'
import { prisma } from './config/prisma'
import routes from './routes'
import { errorMiddleware } from './middlewares/error.middleware'

const app = express()

// ─── Middlewares globales ────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: env.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Archivos estáticos (fotos de plantas) ───────────────────────────────────
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

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
app.listen(env.port, () => {
  console.log(`\n🌱 Kawsapacha Backend corriendo en http://localhost:${env.port}`)
  console.log(`   Healthcheck: http://localhost:${env.port}/api/health\n`)
})

export default app

