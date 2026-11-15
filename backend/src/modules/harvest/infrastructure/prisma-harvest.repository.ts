import { prisma } from '../../../infrastructure/database/prisma'
import type { HarvestRepository, HarvestCreateData, HarvestResourceData } from '../application/ports/harvest.repository'

export const prismaHarvestRepository:HarvestRepository={
 findPlant(id){return prisma.cultivatedPlant.findUnique({where:{id},include:{species:true}})},
 findGarden(id){return prisma.realGarden.findUnique({where:{id},select:{id:true,communityId:true,createdById:true}})},
 async findAcceptedMembership(userId){
  const member=await prisma.communityMember.findFirst({
   where:{userId,status:'ACCEPTED'},select:{communityId:true},orderBy:{joinedAt:'asc'},
  })
  return member?.communityId??null
 },
 async findCreatedCommunity(creatorIds){
  const c=await prisma.community.findFirst({
   where:{OR:creatorIds.map(creatorId=>({creatorId}))},
   select:{id:true},orderBy:{createdAt:'desc'},
  })
  return c?.id??null
 },
 async linkGarden(gardenId,communityId){
  await prisma.realGarden.update({where:{id:gardenId},data:{communityId}})
 },
 createHarvest(data:HarvestCreateData){return prisma.harvestRecord.create({data})},
 findResource(communityId,name){
  return prisma.communityResource.findFirst({where:{communityId,name,category:'SUPPLY'}})
 },
 async incrementResource(id,quantity,unit,description){
  await prisma.communityResource.update({where:{id},data:{
   quantity:{increment:quantity},unit,description,status:'DISPONIBLE',
  }})
 },
 async createResource(data:HarvestResourceData){
  await prisma.communityResource.create({data})
 },
 async markPlantRegrowing(plantId,harvestDate){
  await prisma.cultivatedPlant.update({
   where:{id:plantId},data:{lifecycleStatus:'REGROWING',lastHarvestDate:harvestDate},
  })
 },
 listByGarden(gardenId){
  return prisma.harvestRecord.findMany({
   where:{realGardenId:gardenId},
   include:{harvestedBy:{select:{id:true,name:true}}},
   orderBy:{harvestDate:'desc'},
  })
 },
 listByCommunity(communityId){
  return prisma.harvestRecord.findMany({
   where:{OR:[{communityId},{realGarden:{communityId}}]},
   include:{
    harvestedBy:{select:{id:true,name:true}},
    realGarden:{select:{id:true,name:true}},
   },
   orderBy:{harvestDate:'desc'},
  })
 },
}
