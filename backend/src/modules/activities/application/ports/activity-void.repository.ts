export interface ActivityForVoid {
 id:string;actorUserId:string;voidedAt:Date|null;garden:{createdById:string}
}
export interface VoidedActivity {
 id:string;voidedAt:Date|null;voidReason:string|null
}
export interface ActivityVoidRepository {
 findForVoid(id:string):Promise<ActivityForVoid|null>
 voidAndRevert(id:string,reason:string,userId:string):Promise<{updatedActivity:VoidedActivity;pointsReverted:number}>
}
