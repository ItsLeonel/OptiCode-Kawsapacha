/** Fachada compatible. Casos separados por responsabilidad, sin modificar los contratos REST. */
export { assertGardenAccess } from './activity-access.service'
export { createGardenActivity } from './activity-registration.service'
export { listGardenActivities, getGardenActivityDetail } from '../activity-read.module'
export { voidGardenActivity } from '../activity-void.module'
export type { CreateActivityInput } from './activity-input'
export { VALID_ACTIVITY_TYPES } from '../domain/activity-types'
export type { ActivityType } from '../domain/activity-types'
