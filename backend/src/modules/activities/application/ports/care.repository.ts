import type { Species, CareLogEntry, PlantData } from '../../domain/care-rules'

export interface CareValidationPlant {
 lifecycleStatus:string;species:Species;careLogs:CareLogEntry[]
}
export interface CareLogRecord {id:string;plantId:string;actionType:string;notes:string;userId:string;performedAt:Date}
export interface EvidenceCareLog extends CareLogEntry {
 activities:Array<{id:string;reviewStatus:string;voidedAt:Date|null}>
}
export interface CareGrowthPlant extends PlantData {
 species:Species;careLogs:EvidenceCareLog[]
}
export interface CareSpeciesTips extends Species {
 id:string;fertilizerFrequencyDays:number;wateringFrequencyDays:number;
 growthCycleDays:number;bestPlantingSeason:string;lunarPhaseTip:string
}
export interface CareRepository {
 findForValidation(id:string):Promise<CareValidationPlant|null>
 createLog(input:{plantId:string;actionType:string;notes:string;userId:string}):Promise<CareLogRecord>
 findForGrowth(id:string):Promise<CareGrowthPlant|null>
 markReady(id:string):Promise<void>
 listLogs(id:string):Promise<CareLogRecord[]>
 findSpecies(id:string):Promise<CareSpeciesTips|null>
}
