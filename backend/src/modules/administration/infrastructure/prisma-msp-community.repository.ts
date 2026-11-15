import { Prisma } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma'
import type { MspCommunityRepository } from '../application/ports/msp-community.repository'

/** Conserva el contrato de listados, el orden y los includes del MSP original. */
export const prismaMspCommunityRepository = {
  count(where:Record<string,unknown>) {
    return prisma.community.count({where:where as Prisma.CommunityWhereInput})
  },
  findMany(where:Record<string,unknown>,skip:number,limit:number) {
    return prisma.community.findMany({
      where:where as Prisma.CommunityWhereInput,
      orderBy:{createdAt:'desc'},skip,take:limit,
      include:{
        creator:{select:{id:true,name:true,email:true}},
        gardens:{select:{id:true,name:true,province:true,canton:true,parish:true,latitude:true,longitude:true,kind:true,areaM2:true}},
        _count:{select:{members:{where:{status:'ACCEPTED'}},gardens:true}},
      },
    })
  },
  findForReview(id:string) {
    return prisma.community.findUnique({where:{id},include:{creator:true}})
  },
  updateReview(id:string,changes:{status:'APPROVED'|'NEEDS_CHANGES'|'REJECTED'|'SUSPENDED';reviewedById:string;reviewReason:string|null;reviewedAt:Date}) {
    return prisma.community.update({where:{id},data:changes,include:{creator:{select:{id:true,name:true,email:true}}}})
  },
}
