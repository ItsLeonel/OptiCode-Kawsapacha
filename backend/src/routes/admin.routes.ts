// backend/src/routes/admin.routes.ts
import { Router } from 'express'
import { requireAuth, requireGlobalRole } from '../middlewares/auth.middleware'
import {
  createMspAccount,
  updateUserActiveStatus,
  getAdminUsers,
  getAuditLogs,
} from '../controllers/admin-technical.controller'
import {
  getCommunitiesMsp,
  postReviewCommunity,
  getActivitiesMsp,
  postReviewActivity,
  getEventsMsp,
  postEventMsp,
  deleteEventMsp,
  getResourcesMsp,
  postResourceMsp,
  deleteResourceMsp,
} from '../controllers/admin-msp.controller'

const router = Router()

// Todas las rutas administrativas requieren autenticación obligatoria
router.use(requireAuth)

// ─── RUTAS ADMIN TÉCNICO (Solo ADMIN_TECNICO) ─────────────────────────────────
const technicalRouter = Router()
technicalRouter.use(requireGlobalRole(['ADMIN_TECNICO']))
technicalRouter.post('/msp-users', createMspAccount)
technicalRouter.patch('/users/:id/status', updateUserActiveStatus)
technicalRouter.get('/users', getAdminUsers)
technicalRouter.get('/audit-logs', getAuditLogs)

// ─── RUTAS DE SUPERVISIÓN MSP (ADMIN_MSP y ADMIN_TECNICO) ──────────────────────
const mspRouter = Router()
mspRouter.use(requireGlobalRole(['ADMIN_MSP', 'ADMIN_TECNICO']))
mspRouter.get('/communities', getCommunitiesMsp)
mspRouter.post('/communities/:id/review', postReviewCommunity)
mspRouter.get('/activities', getActivitiesMsp)
mspRouter.post('/activities/:id/review', postReviewActivity)
mspRouter.get('/events', getEventsMsp)
mspRouter.post('/events', postEventMsp)
mspRouter.delete('/events/:id', deleteEventMsp)
mspRouter.get('/resources', getResourcesMsp)
mspRouter.post('/resources', postResourceMsp)
mspRouter.delete('/resources/:id', deleteResourceMsp)

router.use('/technical', technicalRouter)
router.use('/msp', mspRouter)

export default router
