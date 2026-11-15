/** Fachada de compatibilidad: los consumidores conservan las exportaciones MSP públicas.
 * Separar revisiones agrícolas de contenido institucional no cambia rutas ni contratos.
 */
export { listCommunitiesForMsp, reviewCommunity } from './admin-msp-community.service'
export { listActivitiesForMsp, reviewActivity } from './admin-msp-activity.service'
export { listInstitutionalEvents, createInstitutionalEvent, deleteInstitutionalEvent,
  listEducationalResources, createEducationalResource, deleteEducationalResource } from '../admin-msp-content.module'
