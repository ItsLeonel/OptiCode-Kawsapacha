import { prisma } from '../../../infrastructure/database/prisma'
import type { CareRepository } from '../application/ports/care.repository'

export const prismaCareRepository:CareRepository={
 findForValidation(id){
  return prisma.cultivatedPlant.findUnique({
   where:{id},include:{species:true,careLogs:true},
  })
 },
 createLog(data){return prisma.careLog.create({data})},
 findForGrowth(id){
  return prisma.cultivatedPlant.findUnique({
   where:{id},
   include:{
    species:true,
    careLogs:{include:{activities:{select:{id:true,reviewStatus:true,voidedAt:true}}}},
   },
  })
 },
 async markReady(id){
  await prisma.cultivatedPlant.update({
   where:{id},data:{lifecycleStatus:'READY_TO_HARVEST'},
  })
 },
 listLogs(id){
  return prisma.careLog.findMany({
   where:{plantId:id},
   include:{user:{select:{id:true,name:true}}},
   orderBy:{performedAt:'desc'},
  })
 },
 findSpecies(id){return prisma.medicinalCatalog.findUnique({where:{id}})},
}
