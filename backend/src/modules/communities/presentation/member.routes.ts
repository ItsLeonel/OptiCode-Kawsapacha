// backend/src/modules/communities/presentation/member.routes.ts
import { Router } from 'express'
import { invite, list, updateRole, remove } from './member.controller'
import { requireAuth } from '../../../shared/middlewares/auth.middleware'
import { requireCommunityRole } from '../../../shared/middlewares/communityRole.middleware'

const router = Router({ mergeParams: true })

// Listar miembros: acceso para cualquier miembro activo (PARTICIPANTE, CUIDADOR, RESPONSABLE)
router.get('/', requireAuth, list)

// Acciones solo para RESPONSABLE
router.post('/invite', requireAuth, requireCommunityRole(['RESPONSABLE']), invite)
router.patch('/:userId/role', requireAuth, requireCommunityRole(['RESPONSABLE']), updateRole)
router.delete('/:userId', requireAuth, requireCommunityRole(['RESPONSABLE']), remove)

export default router
