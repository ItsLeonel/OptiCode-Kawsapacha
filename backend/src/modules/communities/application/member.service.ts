import type { CommunityMemberRepository, CommunityRole } from './ports/member.repository'
export type { CommunityRole } from './ports/member.repository'

export function createMemberService(repository:CommunityMemberRepository) {
 async function isCommunityResponsable(communityId:string,userId:string):Promise<boolean> {
  const creatorId=await repository.getCreatorId(communityId)
  if(creatorId===userId)return true
  const member=await repository.getMember(communityId,userId)
  return member?.status==='ACCEPTED'&&member.roleInCommunity==='RESPONSABLE'
 }

 async function inviteMember(communityId:string,email:string,role:string,invitedById:string) {
  const isResponsable=await isCommunityResponsable(communityId,invitedById)
  if(!isResponsable){
   const error=new Error('Solo el Responsable de la comunidad tiene permisos para enviar invitaciones.')
   ;(error as {code?:string}).code='FORBIDDEN'
   throw error
  }
  const normalizedRole:CommunityRole=role==='RESPONSABLE'?'RESPONSABLE':'PARTICIPANTE'
  const normalizedEmail=email.trim().toLowerCase()
  const existingUser=await repository.findUserByEmails(normalizedEmail,email.trim())
  if(!existingUser){
   const error=new Error('No existe ningún usuario registrado con el correo ingresado')
   ;(error as {code?:string}).code='USER_NOT_FOUND'
   throw error
  }
  const alreadyMember=await repository.getMember(communityId,existingUser.id)
  if(alreadyMember?.status==='ACCEPTED'){
   const error=new Error('El usuario ya es miembro activo de esta comunidad.')
   ;(error as {code?:string}).code='ALREADY_MEMBER'
   throw error
  }
  if(alreadyMember){
   await repository.updateMembershipPending(alreadyMember.id,normalizedRole)
  }else{
   await repository.createMembershipPending(communityId,existingUser.id,normalizedRole)
  }
  const invitation=await repository.findPendingInvitation(communityId,normalizedEmail,existingUser.email)
  if(invitation){
   return repository.updatePendingInvitation(invitation.id,normalizedRole,invitedById,normalizedEmail)
  }
  return repository.createInvitation(communityId,normalizedEmail,normalizedRole,invitedById)
 }

 function listMembers(communityId:string){return repository.listMembers(communityId)}

 async function updateMemberRole(communityId:string,userId:string,newRole:string,requestUserId:string){
  const isResponsable=await isCommunityResponsable(communityId,requestUserId)
  if(!isResponsable){
   const error=new Error('Solo el Responsable de la comunidad puede modificar roles.')
   ;(error as {code?:string}).code='FORBIDDEN'
   throw error
  }
  const normalizedRole:CommunityRole=newRole==='RESPONSABLE'?'RESPONSABLE':'PARTICIPANTE'
  const member=await repository.updateMemberRole(communityId,userId,normalizedRole)
  const user=await repository.findUserById(userId)
  if(user){
   await repository.updatePendingInvitationRoles(communityId,user.email,normalizedRole)
  }
  return member
 }

 async function removeMember(communityId:string,userId:string,requestUserId:string){
  const isResponsable=await isCommunityResponsable(communityId,requestUserId)
  if(!isResponsable){
   const error=new Error('Solo el Responsable de la comunidad puede eliminar miembros o cancelar invitaciones.')
   ;(error as {code?:string}).code='FORBIDDEN'
   throw error
  }
  const user=await repository.findUserById(userId)
  if(user)await repository.deleteInvitationsForEmail(communityId,user.email)
  return repository.deleteMember(communityId,userId)
 }
 return {isCommunityResponsable,inviteMember,listMembers,updateMemberRole,removeMember}
}
