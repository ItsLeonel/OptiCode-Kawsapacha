import type { PlantReadRepository } from './ports/plant-read.repository'
import { extractGrowthStage } from '../domain/plant-rules'

export function createPlantReadService(
 repository:PlantReadRepository,
 assertGardenAccess:(gardenId:string,userId:string,options?:{requireApproved?:boolean})=>Promise<boolean>
) {
 async function listPlantsByGarden(gardenId:string,requestingUserId:string){
  await assertGardenAccess(gardenId,requestingUserId,{requireApproved:false})
  const plants=await repository.listByGarden(gardenId)
  return plants.map(({activities,...plant})=>({...plant,growthStage:extractGrowthStage(activities)}))
 }
 async function getPlantPassport(plantId:string,requestingUserId:string){
  const owner=await repository.findOwner(plantId)
  if(!owner)return null
  await assertGardenAccess(owner.realGardenId,requestingUserId,{requireApproved:false})
  return repository.findPassport(plantId)
 }
 return {listPlantsByGarden,getPlantPassport}
}
