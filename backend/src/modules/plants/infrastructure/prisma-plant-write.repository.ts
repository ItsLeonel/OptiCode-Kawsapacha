import { Prisma } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma'
/** Persistencia PostgreSQL/SQLite tras puerto: conserva las consultas e includes originales. */
export const prismaPlantWriteRepository = {
  findPlot(gardenId:string,plotIndex:number) {
    return prisma.cultivatedPlant.findUnique({where:{realGardenId_plotIndex:{realGardenId:gardenId,plotIndex}}})
  },
  archiveHarvested(id:string) {
    return prisma.cultivatedPlant.update({where:{id},data:{plotIndex:null,lifecycleStatus:'ARCHIVED',archivedAt:new Date()}})
  },
  findSpecies(id:string) {
    return prisma.medicinalCatalog.findUnique({where:{id}})
  },
  createPlant(data:Record<string,unknown>) {
    return prisma.cultivatedPlant.create({
      data:data as Prisma.CultivatedPlantUncheckedCreateInput,
      include:{species:true,realGarden:{select:{id:true,name:true,province:true}}},
    })
  },
  getPlantForUpdate(id:string) {
    return prisma.cultivatedPlant.findUnique({where:{id},include:{realGarden:true,species:true}})
  },
  getGrowthActivities(plantId:string) {
    return prisma.gardenActivity.findMany({
      where:{plantId,voidedAt:null},orderBy:{createdAt:'desc'},
      select:{details:true,type:true,reviewStatus:true},
    })
  },
  updatePlant(id:string,data:Record<string,unknown>) {
    return prisma.cultivatedPlant.update({
      where:{id},data:data as Prisma.CultivatedPlantUncheckedUpdateInput,
      include:{species:true,realGarden:{select:{id:true,name:true,province:true}}},
    })
  },
  createActivity(data:Record<string,unknown>) {
    return prisma.gardenActivity.create({data:data as Prisma.GardenActivityUncheckedCreateInput})
  },
  createEvidence(data:{activityId:string;filePath:string;fileUrl:string|null;mimeType:string;fileSize:number}) {
    return prisma.activityEvidence.create({data:{...data,fileUrl:data.fileUrl!}})
  },
}
