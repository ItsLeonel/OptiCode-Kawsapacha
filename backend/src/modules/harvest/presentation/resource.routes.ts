// backend/src/modules/harvest/presentation/resource.routes.ts
import { Router } from 'express'
import { list, create, update, remove } from './resource.controller'
import { requireAuth } from '../../../shared/middlewares/auth.middleware'
import { requireCommunityRole } from '../../../shared/middlewares/communityRole.middleware'

const router = Router({ mergeParams: true })

router.get('/', requireAuth, list)
router.post('/', requireAuth, requireCommunityRole(['RESPONSABLE', 'CUIDADOR']), create)
router.patch('/:resourceId', requireAuth, requireCommunityRole(['RESPONSABLE', 'CUIDADOR']), update)
router.delete('/:resourceId', requireAuth, requireCommunityRole(['RESPONSABLE']), remove)

export default router
