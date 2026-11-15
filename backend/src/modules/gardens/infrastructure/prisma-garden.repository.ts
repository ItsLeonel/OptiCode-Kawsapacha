import { prisma } from '../../../infrastructure/database/prisma'
import { withEntityPhoto } from '../../media/media.module'
import type { GardenRepository, GardenPhotoStorage, GardenChanges, GardenNew } from '../application/ports/garden.repository'

export const prismaGardenRepository:GardenRepository={
 findLatestByCommunity(id){return prisma.realGarden.findFirst({where:{communityId:id},orderBy:{updatedAt:'desc'}})},
 findLatestByCreator(id){return prisma.realGarden.findFirst({where:{createdById:id},orderBy:{updatedAt:'desc'}})},
 findById(id){return prisma.realGarden.findUnique({where:{id}})},
 update(id,changes:GardenChanges){return prisma.realGarden.update({where:{id},data:changes})},
 create(data:GardenNew){return prisma.realGarden.create({data})},
 listAccessible(userId,communityId){
  return prisma.realGarden.findMany({
   where:{...(communityId?{communityId}:{}),OR:[
    {createdById:userId},
    {community:{members:{some:{userId,status:'ACCEPTED'}}}},
   ]},
   include:{
    _count:{select:{plants:true}},
    community:{select:{id:true,name:true,province:true,location:true}},
   },
   orderBy:{updatedAt:'desc'},
  })
 },
 getDetails(id){
  return prisma.realGarden.findUnique({
   where:{id},
   include:{
    plants:{include:{species:true},orderBy:{plotIndex:'asc'}},
    community:{select:{id:true,name:true,province:true,location:true}},
   },
  })
 },
}
export const gardenPhotoStorage:GardenPhotoStorage={
 withPhoto(file,remove,previous,save){
  return withEntityPhoto('gardens',file as Express.Multer.File|undefined,remove,previous,save)
 },
}
