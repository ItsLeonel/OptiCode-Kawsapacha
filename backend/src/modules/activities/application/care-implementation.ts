import { calculateGrowthData } from '../domain/care-rules'
import { validateCareAction } from '../domain/care-validation'
import type { CareRepository, EvidenceCareLog } from './ports/care.repository'

/** Casos de uso agrícolas sin acceso directo a Prisma. */
export function createCareService(repository:CareRepository) {
 async function addCareLog(plantId:string,actionType:string,notes:string,userId:string){
  const plantForValidation=await repository.findForValidation(plantId)
  if(!plantForValidation)throw new Error('Planta no encontrada')
  const {allowed,warningMessage}=await validateCareAction(plantId,actionType,{
   lifecycleStatus:plantForValidation.lifecycleStatus,
   species:plantForValidation.species,
   careLogs:plantForValidation.careLogs,
  })
  if(!allowed)throw Object.assign(new Error(warningMessage),{code:'CARE_OVERUSE'})
  const log=await repository.createLog({plantId,actionType,notes,userId})
  const freshPlant=await repository.findForGrowth(plantId)
  if(freshPlant&&freshPlant.lifecycleStatus!=='HARVESTED'){
   const effective=filterEffectiveCareLogs(freshPlant.careLogs)
   const growth=calculateGrowthData(freshPlant,freshPlant.species,effective)
   if(growth.percentage>=76){
    await repository.markReady(plantId)
   }
  }
  return log
 }
 function getCareLogs(plantId:string){return repository.listLogs(plantId)}
 async function calculateGrowth(plantId:string){
  const plant=await repository.findForGrowth(plantId)
  if(!plant)throw new Error('Planta no encontrada')
  const effectiveCareLogs=filterEffectiveCareLogs(plant.careLogs)
  return {
   ...calculateGrowthData(plant,plant.species,effectiveCareLogs),
   lifecycleStatus:plant.lifecycleStatus,
   plantingDate:plant.plantingDate,
   lastHarvestDate:plant.lastHarvestDate,
  }
 }
 async function getCalendarTips(speciesId:string){
  const species=await repository.findSpecies(speciesId)
  if(!species)throw new Error('Especie no encontrada')
  return {
   wateringFrequencyDays:species.wateringFrequencyDays,
   fertilizerFrequencyDays:species.fertilizerFrequencyDays,
   growthCycleDays:species.growthCycleDays,
   bestPlantingSeason:species.bestPlantingSeason,
   lunarPhaseTip:species.lunarPhaseTip,
  }
 }
 return {addCareLog,getCareLogs,calculateGrowth,getCalendarTips}
}

function filterEffectiveCareLogs(logs:EvidenceCareLog[]):EvidenceCareLog[]{
 return logs.filter(cl=>{
  if(!cl.activities||cl.activities.length===0)return true
  return cl.activities.some(a=>a.reviewStatus!=='REJECTED'&&!a.voidedAt)
 })
}
