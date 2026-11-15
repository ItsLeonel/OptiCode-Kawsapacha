export type ReviewAction='APPROVED'|'NEEDS_CHANGES'|'REJECTED'
export interface MspActivityRepository<A extends {id:string;actorUserId:string;type:string;performedDate:string;targetKind:string;plantId:string|null;plotIndex:number|null;reviewStatus:string;reviewedAt:Date|null;voidedAt:Date|null},U,L> {
 count(where:Record<string,unknown>):Promise<number>
 findMany(where:Record<string,unknown>,skip:number,limit:number):Promise<L[]>
 findForReview(id:string):Promise<A|null>
 approveIfUnchanged(id:string,previousStatus:string,reviewedAt:Date|null,reviewerId:string,reason:string|null):Promise<{count:number}>
 getUpdated(id:string):Promise<U>
 updatePlantReview(id:string,status:'APPROVED'|'REJECTED'):Promise<unknown>
 requestChanges(id:string,reviewerId:string,reason:string|null):Promise<U>
 rejectWithReversal(id:string,previousStatus:string,type:string,plantId:string|null,reviewerId:string,reason:string|null):Promise<{updated:U;pointsReverted:number}>
}
export interface MspActivityServices {
 logAudit(input:{actorId:string;action:string;targetResource:string;targetId:string;details:Record<string,unknown>}):Promise<unknown>
 createNotification(input:{userId:string;type:string;title:string;message:string;resourceId:string}):Promise<unknown>
 evaluateActivityReward(input:{id:string;actorUserId:string;type:string;performedDate:string;targetKind:string;plantId?:string|null;plotIndex?:number|null}):Promise<{awarded:boolean;pointsAwarded:number;totalPoints:number;level:string;reason:string}>
 getUserRewardsSummary(userId:string):Promise<{points:number;level:string}>
 syncUserMissionsAndBadges(userId:string):Promise<unknown>
 calculateGrowth(plantId:string):Promise<unknown>
}
