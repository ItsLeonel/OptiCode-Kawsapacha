export interface InvitationBase {
 id:string;communityId:string;email:string;role:string;invitedById:string;status:string;createdAt:Date
}
export interface InvitationWithCommunity extends InvitationBase {
 community:{id:string;name:string;responsible:string;location:string;description:string}
}
export interface InvitationMember {id:string;communityId:string;userId:string;roleInCommunity:string;status:string}
export interface InvitationRepository {
 findPending(email:string,original:string):Promise<InvitationWithCommunity[]>
 findInviters(ids:string[]):Promise<Array<{id:string;name:string;email:string}>>
 findInvitation(id:string):Promise<InvitationBase|null>
 changeStatus(id:string,status:'ACCEPTED'|'REJECTED'):Promise<InvitationBase>
 upsertAcceptedMember(communityId:string,userId:string,role:string):Promise<InvitationMember>
 deletePendingMember(communityId:string,userId:string):Promise<void>
}
