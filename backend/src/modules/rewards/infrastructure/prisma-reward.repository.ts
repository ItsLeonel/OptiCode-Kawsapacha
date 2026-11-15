import { prisma } from '../../../infrastructure/database/prisma'
import { Prisma } from '@prisma/client'
import type { RewardRepository, RewardAwardInput } from '../application/ports/reward.repository'

export const prismaRewardRepository:RewardRepository={
 getLedger(userId){
  return prisma.rewardLedger.findMany({where:{userId},orderBy:{awardedAt:'desc'}})
 },
 getBadges(userId){
  return prisma.userBadge.findMany({where:{userId},orderBy:{earnedAt:'asc'}})
 },
 getMissions(userId){
  return prisma.userMissionProgress.findMany({where:{userId}})
 },
 getActivities(userId){
  return prisma.gardenActivity.findMany({
   where:{actorUserId:userId,voidedAt:null},
   include:{
    plant:{include:{species:true}},
    garden:{select:{name:true}},
    evidences:{orderBy:{createdAt:'asc'}},
   },
   orderBy:{createdAt:'desc'},
   take:100,
  })
 },
 findAward(userId,eventType,sourceId){
  return prisma.rewardLedger.findUnique({where:{userId_eventType_sourceId:{userId,eventType,sourceId}}})
 },
 findSameDayActivities(userId,type,performedDate,activityId){
  return prisma.gardenActivity.findMany({
   where:{actorUserId:userId,type,performedDate,voidedAt:null,id:{not:activityId}},
   include:{
    actorUser:{include:{rewardLedgers:{where:{
     sourceId:{not:activityId},pointsDelta:{gt:0},
    }}}},
   },
  })
 },
 findReversalIds(userId){
  return prisma.rewardLedger.findMany({where:{userId,reversalOfLedgerId:{not:null}},select:{reversalOfLedgerId:true}})
 },
 async createAward(data:RewardAwardInput){
  try{await prisma.rewardLedger.create({data})}
  catch(error:unknown){
   if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2002'){
    throw Object.assign(new Error('Recompensa duplicada'),{code:'REWARD_DUPLICATE'})
   }
   throw error
  }
 },
}
