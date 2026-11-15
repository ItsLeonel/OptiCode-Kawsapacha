import type { HarvestRepository } from './ports/harvest.repository'

/** Casos de uso de cosecha sin importar Prisma. */
export function createHarvestService(repository: HarvestRepository) {
 async function harvestPlant(plantId:string,quantity:string,notes:string,userId:string) {
  const plant=await repository.findPlant(plantId)
  if(!plant)throw new Error('Planta no encontrada')
  const garden=await repository.findGarden(plant.realGardenId)
  let communityId=garden?.communityId??null
  if(!communityId)communityId=await repository.findAcceptedMembership(userId)
  if(!communityId&&garden?.createdById){
   communityId=await repository.findAcceptedMembership(garden.createdById)
  }
  if(!communityId){
   communityId=await repository.findCreatedCommunity([
    userId,...(garden?.createdById?[garden.createdById]:[]),
   ])
  }
  if(communityId&&garden&&!garden.communityId){
   await repository.linkGarden(plant.realGardenId,communityId)
  }
  const harvest=await repository.createHarvest({
   realGardenId:plant.realGardenId,
   communityId,
   speciesName:plant.species.name,
   speciesLatinName:plant.species.latinName,
   quantity,
   notes,
   harvestedById:userId,
  })
  if(communityId){
   const resourceName=`Cosecha: ${plant.species.name}`
   const existingResource=await repository.findResource(communityId,resourceName)
   const match=quantity.trim().match(/^(\d+(?:\.\d+)?)\s*(.*)$/)
   const parsedQty=match&&match[1]?Math.max(1,Math.round(parseFloat(match[1]))):1
   const unitStr=(match&&match[2]?match[2].trim():'')||'porción'
   if(existingResource){
    await repository.incrementResource(
     existingResource.id,parsedQty,unitStr||existingResource.unit,
     `Última cosecha: ${quantity}. ${notes}`.trim(),
    )
   }else{
    await repository.createResource({
     communityId,
     name:resourceName,
     category:'SUPPLY',
     quantity:parsedQty,
     unit:unitStr,
     status:'DISPONIBLE',
     description:`Cosecha fresca de ${plant.species.name} (${plant.species.latinName}). ${notes}`.trim(),
    })
   }
  }
  await repository.markPlantRegrowing(plantId,new Date())
  return harvest
 }
 function listHarvestsByGarden(gardenId:string){return repository.listByGarden(gardenId)}
 function listHarvestsByCommunity(communityId:string){return repository.listByCommunity(communityId)}
 return {harvestPlant,listHarvestsByGarden,listHarvestsByCommunity}
}
