export type CommunityRole='RESPONSABLE'|'PARTICIPANTE'
export interface MemberRecord {
 id:string;communityId:string;userId:string;roleInCommunity:string;status:string
}
export interface MemberUser {id:string;email:string}
export interface InvitationRecord {id:string;status:string;email:string;communityId:string;role:string;invitedById:string}
export interface CommunityMemberRepository {
 getCreatorId(communityId:string):Promise<string|null>
 getMember(communityId:string,userId:string):Promise<MemberRecord|null>
 findUserByEmails(normalized:string,trimmed:string):Promise<MemberUser|null>
 updateMembershipPending(id:string,role:CommunityRole):Promise<void>
 createMembershipPending(communityId:string,userId:string,role:CommunityRole):Promise<void>
 findPendingInvitation(communityId:string,normalized:string,actual:string):Promise<InvitationRecord|null>
 updatePendingInvitation(id:string,role:CommunityRole,invitedById:string,email:string):Promise<InvitationRecord>
 createInvitation(communityId:string,email:string,role:CommunityRole,invitedById:string):Promise<InvitationRecord>
 listMembers(communityId:string):Promise<unknown[]>
 updateMemberRole(communityId:string,userId:string,role:CommunityRole):Promise<MemberRecord>
 findUserById(id:string):Promise<MemberUser|null>
 updatePendingInvitationRoles(communityId:string,email:string,role:CommunityRole):Promise<void>
 deleteInvitationsForEmail(communityId:string,email:string):Promise<void>
 deleteMember(communityId:string,userId:string):Promise<MemberRecord>
}
