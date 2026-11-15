export interface MissionActivity {
  type:string;performedDate:string;evidences:Array<{id:string}>
}
export interface MissionProgress {
  id:string;completed:boolean;completedAt:Date|null
}
export interface MissionEntry {
  id:string;eventType:string;pointsDelta:number;reversalOfLedgerId:string|null
}
export interface MissionProgressData {
  userId:string;missionId:string;currentValue:number;targetValue:number;completed:boolean;completedAt:Date|null
}
export interface MissionLedgerData {
  userId:string;eventType:string;ruleKey:string;sourceId:string;pointsDelta:number;reason:string;reversalOfLedgerId?:string
}
export type MissionLunarAdvisor = (date:string,timezone:string)=>{recommendations:Array<{activityType:string}>}
export interface MissionRepository {
  listApprovedActivities(userId:string):Promise<MissionActivity[]>
  deleteBadge(userId:string,badgeId:string):Promise<unknown>
  listBadges(userId:string):Promise<Array<{badgeId:string;earnedAt:Date}>>
  listMissions(userId:string):Promise<Array<{missionId:string;currentValue:number;targetValue:number;completed:boolean;completedAt:Date|null}>>
  findMission(userId:string,missionId:string):Promise<MissionProgress|null>
  createMission(data:MissionProgressData):Promise<unknown>
  updateMission(id:string,data:Omit<MissionProgressData,'userId'|'missionId'>):Promise<unknown>
  getMissionLedger(userId:string,missionId:string):Promise<MissionEntry[]>
  createLedger(data:MissionLedgerData):Promise<unknown>
  findBadge(userId:string,badgeId:string):Promise<{id:string}|null>
  createBadge(userId:string,badgeId:string):Promise<unknown>
}
