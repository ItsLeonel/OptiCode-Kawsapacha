// backend/src/modules/activities/presentation/activity.routes.ts
import { Router } from 'express'
import { requireAuth } from '../../../shared/middlewares/auth.middleware'
import { uploadActivityPhoto } from '../../../shared/middlewares/upload.middleware'
import {
  createActivity,
  getActivities,
  getActivityDetail,
  voidActivity,
} from './activity.controller'

// mergeParams: true permite acceder a :gardenId desde el router padre
const router = Router({ mergeParams: true })

router.use(requireAuth)

// Endpoints de Bitácora Viva por huerto
router.post('/', uploadActivityPhoto, createActivity)
router.get('/', getActivities)
router.get('/:activityId', getActivityDetail)
router.post('/:activityId/void', voidActivity)

export default router

