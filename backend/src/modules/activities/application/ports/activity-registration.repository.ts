import type { Species, CareLogEntry } from '../../domain/care-rules'
import type { ActivityType } from '../../domain/activity-types'

export interface ActivityPlant {
 id:string;realGardenId:string;plotIndex:number|null;archivedAt:Date|null;lifecycleStatus:string;customName:string;
 species:Species
}
export interface ActivityForCare {
 lifecycleStatus:string;species:Species;careLogs:CareLogEntry[];plantingDate:Date;lastHarvestDate:Date|null
}
export interface PersistedActivity {
 id:string;gardenId:string;actorUserId:string;plantId:string|null;plotIndex:number|null;type:string;
 performedDate:string;targetKind:string
}
export interface ActivityInputData {
 gardenId:string;actorUserId:string;type:ActivityType;performedDate:string;targetKind:string;
 plantId?:string|null;plotIndex?:number|null;notes:string;details:string;
 clientActivityId:string|null;careLogId:string|null;harvestRecordId:string|null;
 reviewStatus:'APPROVED'
}
export interface EvidenceInputData {
 activityId:string;filePath:string;fileUrl:string;mimeType:string;fileSize:number
}
export interface ActivityRegistrationRepository {
 findClientActivity(clientActivityId:string):Promise<PersistedActivity|null>
 findPlantInPlot(gardenId:string,plotIndex:number):Promise<ActivityPlant|null>
 findPlant(id:string):Promise<ActivityPlant|null>
 findPlantForCare(id:string):Promise<ActivityForCare|null>
 createCareLog(input:{plantId:string;actionType:string;notes:string;userId:string;performedAt:Date}):Promise<{id:string}>
 findRecentHilling(plantId:string,fromDate:string):Promise<boolean>
 createActivity(input:ActivityInputData):Promise<PersistedActivity>
 createEvidence(input:EvidenceInputData):Promise<void>
 findFullActivity(id:string):Promise<PersistedActivity|null>
}
export interface ActivityRegistrationServices {
 assertGardenAccess(gardenId:string,userId:string):Promise<boolean>
 harvestPlant(plantId:string,quantity:string,notes:string,userId:string):Promise<{id:string}>
 evaluateActivityReward(input:{id:string;actorUserId:string;type:string;performedDate:string;targetKind:string;plantId:string|null;plotIndex:number|null}):Promise<unknown>
 syncUserMissionsAndBadges(userId:string):Promise<unknown>
}
