import { Router } from 'express'
import { create, list, getById, update } from './community.controller'
import { requireAuth } from '../../../shared/middlewares/auth.middleware'
import { requireCommunityRole } from '../../../shared/middlewares/communityRole.middleware'
import { uploadEntityPhoto } from '../../../shared/middlewares/entity-photo.middleware'

const router = Router()

router.get('/', requireAuth, list)
router.post('/', requireAuth, uploadEntityPhoto, create)
router.get('/:id', requireAuth, getById)
// Solo RESPONSABLE puede editar la comunidad
router.put('/:id', requireAuth, requireCommunityRole(['RESPONSABLE']), uploadEntityPhoto, update)

export default router
