import { prisma } from '../../../infrastructure/database/prisma'
import type { ActivityRegistrationRepository, ActivityInputData, EvidenceInputData } from '../application/ports/activity-registration.repository'

export const prismaActivityRegistrationRepository:ActivityRegistrationRepository={
 findClientActivity(clientActivityId){
  return prisma.gardenActivity.findUnique({
   where:{clientActivityId},
   include:{evidences:true,actorUser:{select:{id:true,name:true,email:true}}},
  })
 },
 findPlantInPlot(gardenId,plotIndex){
  return prisma.cultivatedPlant.findFirst({
   where:{realGardenId:gardenId,plotIndex,archivedAt:null,lifecycleStatus:{not:'REMOVED'}},
   include:{species:true},
  })
 },
 findPlant(id){
  return prisma.cultivatedPlant.findUnique({where:{id},include:{species:true}})
 },
 findPlantForCare(id){
  return prisma.cultivatedPlant.findUnique({where:{id},include:{species:true,careLogs:true}})
 },
 async createCareLog(data){
  return prisma.careLog.create({data})
 },
 async findRecentHilling(plantId,fromDate){
  const recent=await prisma.gardenActivity.findFirst({
   where:{plantId,type:'hilling',voidedAt:null,performedDate:{gte:fromDate}},
  })
  return Boolean(recent)
 },
 createActivity(data:ActivityInputData){return prisma.gardenActivity.create({data})},
 async createEvidence(data:EvidenceInputData){await prisma.activityEvidence.create({data})},
 findFullActivity(id){
  return prisma.gardenActivity.findUnique({
   where:{id},
   include:{
    evidences:true,
    actorUser:{select:{id:true,name:true,email:true}},
    plant:{select:{id:true,customName:true,plotIndex:true,species:true}},
   },
  })
 },
}
