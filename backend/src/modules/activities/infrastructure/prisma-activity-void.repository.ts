import { prisma } from '../../../infrastructure/database/prisma'
import { revertActivityReward } from '../../rewards/rewards.module'
import type { ActivityVoidRepository } from '../application/ports/activity-void.repository'

/** Anulación y reversión atómicas en una sola transacción. */
export const prismaActivityVoidRepository:ActivityVoidRepository={
 findForVoid(id){
  return prisma.gardenActivity.findUnique({where:{id},include:{garden:true}})
 },
 voidAndRevert(id,reason,userId){
  return prisma.$transaction(async tx=>{
   const changed=await tx.gardenActivity.updateMany({
    where:{id,voidedAt:null},
    data:{voidedAt:new Date(),voidReason:reason,voidedByUserId:userId},
   })
   if(changed.count!==1){
    throw Object.assign(new Error('Esta actividad ya fue anulada.'),{code:'ACTIVITY_VOIDED'})
   }
   const pointsReverted=await revertActivityReward(id,reason,tx)
   const updatedActivity=await tx.gardenActivity.findUniqueOrThrow({
    where:{id},
    include:{evidences:true,actorUser:{select:{id:true,name:true,email:true}}},
   })
   return {updatedActivity,pointsReverted}
  })
 },
}
