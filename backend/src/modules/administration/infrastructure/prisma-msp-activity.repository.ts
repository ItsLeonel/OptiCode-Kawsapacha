import { Prisma } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma'
import { revertActivityReward } from '../../rewards/infrastructure/prisma-reward-reversal'

/** Implementación de persistencia y límites transaccionales del MSP. */
export const prismaMspActivityRepository = {
  count(where:Record<string,unknown>) {
    return prisma.gardenActivity.count({where:where as Prisma.GardenActivityWhereInput})
  },
  findMany(where:Record<string,unknown>,skip:number,limit:number) {
    return prisma.gardenActivity.findMany({
      where:where as Prisma.GardenActivityWhereInput,
      orderBy:{createdAt:'desc'},skip,take:limit,
      include:{
        actorUser:{select:{id:true,name:true,email:true}},
        garden:{select:{id:true,name:true,province:true,canton:true,communityId:true}},
        plant:{include:{species:true}},
        evidences:true,
      },
    })
  },
  findForReview(id:string) {
    return prisma.gardenActivity.findUnique({
      where:{id},
      include:{actorUser:true,evidences:true,garden:{include:{community:{select:{id:true,name:true,status:true}}}}},
    })
  },
  approveIfUnchanged(id:string,reviewStatus:string,reviewedAt:Date|null,reviewedById:string,reviewReason:string|null) {
    return prisma.gardenActivity.updateMany({
      where:{id,reviewStatus,reviewedAt},
      data:{reviewStatus:'APPROVED',reviewedById,reviewReason,reviewedAt:new Date()},
    })
  },
  getUpdated(id:string) { return prisma.gardenActivity.findUniqueOrThrow({where:{id}}) },
  updatePlantReview(id:string,reviewStatus:'APPROVED'|'REJECTED') {
    return prisma.cultivatedPlant.update({where:{id},data:{reviewStatus}})
  },
  requestChanges(id:string,reviewedById:string,reviewReason:string|null) {
    return prisma.gardenActivity.update({where:{id},data:{reviewStatus:'NEEDS_CHANGES',reviewedById,reviewReason,reviewedAt:new Date()}})
  },
  rejectWithReversal(id:string,reviewStatus:string,type:string,plantId:string|null,reviewedById:string,reviewReason:string|null) {
    return prisma.$transaction(async tx=>{
      const changed=await tx.gardenActivity.updateMany({
        where:{id,reviewStatus,voidedAt:null},
        data:{reviewStatus:'REJECTED',reviewedById,reviewReason,reviewedAt:new Date()},
      })
      if(changed.count!==1)throw Object.assign(new Error('La actividad fue revisada por otra persona. Actualiza la bandeja.'),{code:'REVIEW_FINALIZED'})
      if(type==='sowing'&&plantId)await tx.cultivatedPlant.update({where:{id:plantId},data:{reviewStatus:'REJECTED'}})
      const pointsReverted=await revertActivityReward(id,`Invalidación MSP: ${reviewReason}`,tx)
      const updated=await tx.gardenActivity.findUniqueOrThrow({where:{id}})
      return {updated,pointsReverted}
    })
  },
}
