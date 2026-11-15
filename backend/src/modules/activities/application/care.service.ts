/** Fachada de compatibilidad con el contrato agrícola V1. */
export { validateCareAction } from '../domain/care-validation'
export type { HealthStatus } from '../domain/care-rules'
export {addCareLog,getCareLogs,calculateGrowth,getCalendarTips} from '../care.module'
