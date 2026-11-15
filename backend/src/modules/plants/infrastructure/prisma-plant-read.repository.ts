import { prisma } from '../../../infrastructure/database/prisma'
import type { PlantReadRepository, PlantLifecycleRepository } from '../application/ports/plant-read.repository'

export const prismaPlantReadRepository:PlantReadRepository={
 listByGarden(gardenId){
  return prisma.cultivatedPlant.findMany({
   where:{realGardenId:gardenId},
   select:{
    id:true,plotIndex:true,speciesId:true,customName:true,photoUrl:true,photoPath:true,
    photoMime:true,photoSize:true,notes:true,plantingDate:true,lifecycleStatus:true,
    observedState:true,lastHarvestDate:true,archivedAt:true,reviewStatus:true,
    registeredById:true,realGardenId:true,createdAt:true,updatedAt:true,species:true,
    activities:{where:{voidedAt:null},orderBy:{createdAt:'desc'},select:{details:true,type:true,reviewStatus:true}},
   },
   orderBy:{plotIndex:'asc'},
  })
 },
 findOwner(plantId){return prisma.cultivatedPlant.findUnique({where:{id:plantId},select:{realGardenId:true}})},
 findPassport(plantId){
  return prisma.cultivatedPlant.findUnique({
   where:{id:plantId},
   include:{
    species:true,
    realGarden:{select:{id:true,name:true,province:true,canton:true,parish:true,latitude:true,longitude:true}},
    registeredBy:{select:{id:true,name:true}},
   },
  })
 },
}
export const prismaPlantLifecycleRepository:PlantLifecycleRepository={
 findForRemoval(id){
  return prisma.cultivatedPlant.findUnique({
   where:{id},select:{id:true,registeredById:true,realGarden:{select:{createdById:true}}},
  })
 },
 findForArchive(id){
  return prisma.cultivatedPlant.findUnique({
   where:{id},select:{id:true,registeredById:true,
    realGarden:{select:{createdById:true,communityId:true,community:{select:{creatorId:true}}}}},
  })
 },
 async findMemberRole(communityId,userId){
  const member=await prisma.communityMember.findFirst({
   where:{communityId,userId,status:'ACCEPTED'},select:{roleInCommunity:true},
  })
  return member?.roleInCommunity??null
 },
 async remove(id){await prisma.cultivatedPlant.delete({where:{id}})},
 archive(id,at){
  return prisma.cultivatedPlant.update({
   where:{id},data:{lifecycleStatus:'ARCHIVED',archivedAt:at,plotIndex:null},
   include:{species:true,realGarden:{select:{id:true,name:true,province:true}}},
  })
 },
}
