import { prisma } from '../../../infrastructure/database/prisma'
import type { CommunityMemberRepository, CommunityRole } from '../application/ports/member.repository'

export const prismaCommunityMemberRepository:CommunityMemberRepository={
 async getCreatorId(communityId){
  const c=await prisma.community.findUnique({where:{id:communityId},select:{creatorId:true}})
  return c?.creatorId??null
 },
 getMember(communityId,userId){
  return prisma.communityMember.findUnique({where:{communityId_userId:{communityId,userId}}})
 },
 findUserByEmails(normalized,trimmed){
  return prisma.user.findFirst({where:{OR:[{email:normalized},{email:trimmed}]},select:{id:true,email:true}})
 },
 async updateMembershipPending(id,role){
  await prisma.communityMember.update({where:{id},data:{roleInCommunity:role,status:'PENDING'}})
 },
 async createMembershipPending(communityId,userId,role){
  await prisma.communityMember.create({data:{communityId,userId,roleInCommunity:role,status:'PENDING'}})
 },
 findPendingInvitation(communityId,normalized,actual){
  return prisma.communityInvitation.findFirst({
   where:{communityId,OR:[{email:normalized},{email:actual}],status:'PENDING'},
  })
 },
 updatePendingInvitation(id,role,invitedById,email){
  return prisma.communityInvitation.update({
   where:{id},data:{role,invitedById,email,status:'PENDING'},
  })
 },
 createInvitation(communityId,email,role,invitedById){
  return prisma.communityInvitation.create({data:{communityId,email,role,invitedById,status:'PENDING'}})
 },
 listMembers(communityId){
  return prisma.communityMember.findMany({
   where:{communityId},
   include:{user:{select:{id:true,name:true,email:true,role:true}}},
   orderBy:{joinedAt:'asc'},
  })
 },
 updateMemberRole(communityId,userId,role){
  return prisma.communityMember.update({where:{communityId_userId:{communityId,userId}},data:{roleInCommunity:role}})
 },
 findUserById(id){return prisma.user.findUnique({where:{id},select:{id:true,email:true}})},
 async updatePendingInvitationRoles(communityId,email,role){
  await prisma.communityInvitation.updateMany({where:{communityId,email,status:'PENDING'},data:{role}})
 },
 async deleteInvitationsForEmail(communityId,email){
  await prisma.communityInvitation.deleteMany({where:{communityId,email}})
 },
 deleteMember(communityId,userId){
  return prisma.communityMember.delete({where:{communityId_userId:{communityId,userId}}})
 },
}
