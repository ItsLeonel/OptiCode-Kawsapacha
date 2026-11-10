import { Router } from 'express'
import { create, list, getById, update } from '../controllers/community.controller'
import { requireAuth } from '../middlewares/auth.middleware'
import { requireCommunityRole } from '../middlewares/communityRole.middleware'
import { uploadEntityPhoto } from '../middlewares/entity-photo.middleware'

const router = Router()

router.get('/', requireAuth, list)
router.post('/', requireAuth, uploadEntityPhoto, create)
router.get('/:id', requireAuth, getById)
// Solo RESPONSABLE puede editar la comunidad
router.put('/:id', requireAuth, requireCommunityRole(['RESPONSABLE']), uploadEntityPhoto, update)

export default router
