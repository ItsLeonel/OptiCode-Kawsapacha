/** Composición de capacidades MSP, ajena a los casos de uso application. */
export { listCommunitiesForMsp, reviewCommunity } from './admin-msp-community.module'
export { listActivitiesForMsp, reviewActivity } from './admin-msp-activity.module'
export {
  listInstitutionalEvents, createInstitutionalEvent, deleteInstitutionalEvent,
  listEducationalResources, createEducationalResource, deleteEducationalResource,
} from './admin-msp-content.module'
