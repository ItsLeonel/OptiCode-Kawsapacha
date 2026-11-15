/** Puertos de supervisión MSP para comunidades. Sin dependencias ORM. */
export type MspCommunityAction = 'APPROVED' | 'NEEDS_CHANGES' | 'REJECTED' | 'SUSPENDED'
export interface MspCommunityRepository<C extends {status:string;name:string;creatorId:string},U,L> {
  count(where:Record<string,unknown>):Promise<number>
  findMany(where:Record<string,unknown>,skip:number,limit:number):Promise<L[]>
  findForReview(id:string):Promise<C|null>
  updateReview(id:string,changes:{status:MspCommunityAction;reviewedById:string;reviewReason:string|null;reviewedAt:Date}):Promise<U>
}
export interface MspReviewServices {
  logAudit(input:{actorId:string;action:string;targetResource:string;targetId:string;details:Record<string,unknown>}):Promise<unknown>
  createNotification(input:{userId:string;type:string;title:string;message:string;resourceId:string}):Promise<unknown>
}
