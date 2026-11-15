import { prisma } from '../../../infrastructure/database/prisma'
import type { InvitationRepository } from '../application/ports/invitation.repository'

export const prismaInvitationRepository:InvitationRepository={
 findPending(email,original){
  return prisma.communityInvitation.findMany({
   where:{OR:[{email},{email:original}],status:'PENDING'},
   include:{community:{select:{id:true,name:true,responsible:true,location:true,description:true}}},
   orderBy:{createdAt:'desc'},
  })
 },
 findInviters(ids){
  return prisma.user.findMany({where:{id:{in:ids}},select:{id:true,name:true,email:true}})
 },
 findInvitation(id){return prisma.communityInvitation.findUnique({where:{id}})},
 changeStatus(id,status){
  return prisma.communityInvitation.update({where:{id},data:{status}})
 },
 upsertAcceptedMember(communityId,userId,role){
  return prisma.communityMember.upsert({
   where:{communityId_userId:{communityId,userId}},
   update:{status:'ACCEPTED',roleInCommunity:role},
   create:{communityId,userId,roleInCommunity:role,status:'ACCEPTED'},
  })
 },
 async deletePendingMember(communityId,userId){
  await prisma.communityMember.deleteMany({where:{communityId,userId,status:'PENDING'}})
 },
}
