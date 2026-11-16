/** Modelos mínimos del ledger y el progreso, ajenos a Prisma. */
export interface RewardLedgerEntry {
 id:string;userId:string;eventType:string;sourceId:string;pointsDelta:number;reason:string;
 awardedAt:Date;reversalOfLedgerId:string|null
}
export interface RewardBadge {badgeId:string;earnedAt:Date}
export interface RewardMission {
 missionId:string;currentValue:number;targetValue:number;completed:boolean;completedAt:Date|null
}
export interface RewardActivity {
 id:string;type:string;reviewStatus:string;createdAt:Date;reviewedAt:Date|null;reviewReason:string|null;
 plant:{customName:string;species:{name:string}|null}|null;
 garden:{name:string}|null;evidences:Array<{id:string}>
}
export interface RewardPriorActivity {
 id:string;targetKind:string;plantId:string|null;plotIndex:number|null;
 actorUser:{rewardLedgers:Array<{id:string;sourceId:string}>}
}
export interface RewardAwardInput {
 userId:string;eventType:string;ruleKey:string;sourceId:string;pointsDelta:number;reason:string
}
export interface RewardRepository {
 getLedger(userId:string):Promise<RewardLedgerEntry[]>
 getBadges(userId:string):Promise<RewardBadge[]>
 getMissions(userId:string):Promise<RewardMission[]>
 getActivities(userId:string):Promise<RewardActivity[]>
 findAward(userId:string,eventType:string,sourceId:string):Promise<RewardLedgerEntry|null>
 findSameDayActivities(userId:string,type:string,performedDate:string,activityId:string):Promise<RewardPriorActivity[]>
 findReversalIds(userId:string):Promise<Array<{reversalOfLedgerId:string|null}>>
 createAward(data:RewardAwardInput):Promise<void>
}
