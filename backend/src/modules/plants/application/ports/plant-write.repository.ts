/** Puertos de escritura de plantas; la aplicación no conoce Prisma ni sistemas de archivos. */
export interface PlantPlotRecord {
  id:string; lifecycleStatus:string; reviewStatus:string; customName:string|null
}
export interface PlantSpeciesRecord {name:string}
export interface PlantUpdateRecord {
  id:string; realGardenId:string; notes:string; observedState:string|null; plotIndex:number|null
}
export interface PlantWriteRepository<Registered extends {id:string}, Updated extends {plotIndex:number|null;photoUrl:string|null}> {
  findPlot(gardenId:string,plotIndex:number):Promise<PlantPlotRecord|null>
  archiveHarvested(plantId:string):Promise<unknown>
  findSpecies(speciesId:string):Promise<PlantSpeciesRecord|null>
  createPlant(data:Record<string,unknown>):Promise<Registered>
  getPlantForUpdate(id:string):Promise<PlantUpdateRecord|null>
  getGrowthActivities(plantId:string):Promise<Array<{details:string;type:string;reviewStatus:string}>>
  updatePlant(id:string,data:Record<string,unknown>):Promise<Updated>
  createActivity(data:Record<string,unknown>):Promise<{id:string}>
  createEvidence(data:{activityId:string;filePath:string;fileUrl:string|null;mimeType:string;fileSize:number}):Promise<unknown>
}
export interface PlantWriteServices {
  assertGardenAccess(gardenId:string,userId:string):Promise<boolean>
  evaluateActivityReward(activity:{id:string;actorUserId:string;type:string;performedDate:string;targetKind:string;plantId?:string|null;plotIndex?:number|null}):Promise<unknown>
  syncUserMissionsAndBadges(userId:string):Promise<unknown>
  basename(filepath:string):string
}
