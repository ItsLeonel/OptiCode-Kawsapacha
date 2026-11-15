import { prisma } from '../../../infrastructure/database/prisma'
import type { ActivityReadRepository, ActivityReadFilter } from '../application/ports/activity-read.repository'

const include={
 evidences:true,
 actorUser:{select:{id:true,name:true,email:true}},
 plant:{select:{id:true,customName:true,plotIndex:true,species:true}},
} as const

export const prismaActivityReadRepository:ActivityReadRepository={
 list(filter:ActivityReadFilter){
  const where:Record<string,unknown>={gardenId:filter.gardenId}
  if(!filter.includeVoided)where['voidedAt']=null
  if(filter.plantId)where['plantId']=filter.plantId
  if(filter.type)where['type']=filter.type
  if(filter.from||filter.to){
   where['performedDate']={
    ...(filter.from?{gte:filter.from}:{}),
    ...(filter.to?{lte:filter.to}:{}),
   }
  }
  return prisma.gardenActivity.findMany({
   where,include,orderBy:[{performedDate:'desc'},{createdAt:'desc'}],
  })
 },
 getDetail(activityId){
  return prisma.gardenActivity.findUnique({where:{id:activityId},include})
 },
}
