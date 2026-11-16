import type { InvitationRepository } from './ports/invitation.repository'

export function createInvitationService(repository:InvitationRepository) {
 async function getPendingInvitationsForEmail(email:string){
  const cleanEmail=email.trim().toLowerCase()
  const invitations=await repository.findPending(cleanEmail,email.trim())
  const inviterIds=[...new Set(invitations.map(i=>i.invitedById).filter(Boolean))]
  const inviters=await repository.findInviters(inviterIds)
  const inviterMap=new Map(inviters.map(u=>[u.id,u.name]))
  return invitations.map(inv=>({
   id:inv.id,
   communityId:inv.communityId,
   communityName:inv.community.name,
   communityLocation:inv.community.location,
   role:inv.role,
   invitedById:inv.invitedById,
   invitedByName:inviterMap.get(inv.invitedById)||inv.community.responsible||'Responsable de la comunidad',
   createdAt:inv.createdAt.toISOString(),
   status:inv.status,
  }))
 }
 async function acceptInvitation(invitationId:string,userId:string,userEmail:string){
  const invitation=await repository.findInvitation(invitationId)
  const cleanUserEmail=userEmail.trim().toLowerCase()
  const cleanInvEmail=invitation?.email?.trim().toLowerCase()
  if(!invitation||cleanInvEmail!==cleanUserEmail){
   throw Object.assign(new Error('Invitación no encontrada o no pertenece a tu cuenta.'),{code:'NOT_FOUND'})
  }
  if(invitation.status!=='PENDING'){
   throw Object.assign(new Error('Esta invitación ya ha sido procesada previamente.'),{code:'ALREADY_PROCESSED'})
  }
  const updatedInvitation=await repository.changeStatus(invitationId,'ACCEPTED')
  const member=await repository.upsertAcceptedMember(invitation.communityId,userId,invitation.role)
  return {invitation:updatedInvitation,member,communityId:invitation.communityId}
 }
 async function rejectInvitation(invitationId:string,userId:string,userEmail:string){
  const invitation=await repository.findInvitation(invitationId)
  const cleanUserEmail=userEmail.trim().toLowerCase()
  const cleanInvEmail=invitation?.email?.trim().toLowerCase()
  if(!invitation||cleanInvEmail!==cleanUserEmail){
   throw Object.assign(new Error('Invitación no encontrada o no pertenece a tu cuenta.'),{code:'NOT_FOUND'})
  }
  const updatedInvitation=await repository.changeStatus(invitationId,'REJECTED')
  await repository.deletePendingMember(invitation.communityId,userId)
  return {invitation:updatedInvitation,rejected:true}
 }
 return {getPendingInvitationsForEmail,acceptInvitation,rejectInvitation}
}
