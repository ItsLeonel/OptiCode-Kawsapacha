import { prisma } from '../../../infrastructure/database/prisma'
import { withEntityPhoto } from '../../media/application/entity-photo.service'
import type { CommunityRepository, CommunityPhotoStorage, CommunityCreateData, CommunityUpdateData } from '../application/ports/community.repository'

/** Consultas e incluye relaciones exactamente como el servicio V1. */
export const prismaCommunityRepository:CommunityRepository={
 findCreated(creatorId){return prisma.community.findFirst({where:{creatorId},select:{id:true}})},
 create(data:CommunityCreateData){
  return prisma.community.create({
   data:{...data,members:{create:{userId:data.creatorId,roleInCommunity:'RESPONSABLE',status:'ACCEPTED'}}},
   include:{members:true,_count:{select:{members:{where:{status:'ACCEPTED'}},gardens:true}}},
  })
 },
 listForUser(userId){
  return prisma.community.findMany({
   where:{OR:[{creatorId:userId},{members:{some:{userId,status:'ACCEPTED'}}}]},
   include:{_count:{select:{members:{where:{status:'ACCEPTED'}},gardens:true}}},
   orderBy:{createdAt:'desc'},
  })
 },
 getDetail(id){
  return prisma.community.findUnique({
   where:{id},
   include:{
    members:{include:{user:{select:{id:true,name:true,email:true}}}},
    gardens:true,
   },
  })
 },
 getMetadata(id){
  return prisma.community.findUniqueOrThrow({where:{id},select:{photoUrl:true,status:true,name:true}})
 },
 update(id,data:CommunityUpdateData){
  return prisma.community.update({
   where:{id},data,
   include:{_count:{select:{members:{where:{status:'ACCEPTED'}},gardens:true}}},
  })
 },
}
export const communityPhotoStorage:CommunityPhotoStorage={
 withPhoto(file,remove,previous,save){
  return withEntityPhoto('communities',file as Express.Multer.File|undefined,remove,previous,save)
 },
}
