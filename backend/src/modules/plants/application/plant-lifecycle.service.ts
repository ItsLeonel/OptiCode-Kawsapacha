import type { PlantLifecycleRepository } from './ports/plant-read.repository'

export function createPlantLifecycleService(repository:PlantLifecycleRepository) {
 async function removePlant(plantId:string,requestingUserId:string){
  const plant=await repository.findForRemoval(plantId)
  if(!plant)throw Object.assign(new Error('Planta no encontrada.'),{code:'NOT_FOUND'})
  const isOwner=plant.registeredById===requestingUserId
  const isGardenOwner=plant.realGarden?.createdById===requestingUserId
  if(!isOwner&&!isGardenOwner){
   throw Object.assign(new Error('No tienes permiso para remover esta planta. Solo el registrador o el dueño del huerto pueden desarraigarla.'),{code:'FORBIDDEN'})
  }
  // La eliminación conserva la cascada existente de careLogs.
  await repository.remove(plantId)
 }

 async function archivePlant(plantId:string,requestingUserId:string){
  const plant=await repository.findForArchive(plantId)
  if(!plant)throw Object.assign(new Error('Planta no encontrada.'),{code:'NOT_FOUND'})
  if(plant.realGarden?.communityId){
   const role=await repository.findMemberRole(plant.realGarden.communityId,requestingUserId)
   const isCommunityCreator=plant.realGarden.community?.creatorId===requestingUserId
   const isGardenCreator=plant.realGarden.createdById===requestingUserId
   const responsible=role==='RESPONSABLE'||isCommunityCreator||isGardenCreator
   if(!responsible){
    throw Object.assign(new Error('Solo las personas con rol Responsable pueden archivar plantas y liberar parcelas. Los participantes no tienen permisos para archivar.'),{code:'FORBIDDEN'})
   }
  }else{
   const isOwner=plant.registeredById===requestingUserId
   const isGardenOwner=plant.realGarden?.createdById===requestingUserId
   if(!isOwner&&!isGardenOwner){
    throw Object.assign(new Error('Solo el responsable del huerto puede archivar esta planta.'),{code:'FORBIDDEN'})
   }
  }
  return repository.archive(plantId,new Date())
 }
 return {removePlant,archivePlant}
}
