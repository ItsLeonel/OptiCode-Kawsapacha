import { expect, test } from '@playwright/test'
import { applyJournalCommand, emptyJournal, projectPlants } from '../src/features/my-garden/journal/journal'
import { type GardenActivity } from '../src/features/my-garden/journal/activities'
import { localDate } from '../src/features/my-garden/plant-record'
import { calculateProgress } from '../src/features/my-garden/journal/progress'
import { statusForHarvestLot } from '../src/features/my-garden/journal/postharvest'
import type { RealGarden } from '../src/features/real-gardens/real-garden'

const terrain: RealGarden = {
  name:'Huerto educativo',kind:'pots',areaM2:12,
  location:{province:'Pichincha',provinceCode:'17',canton:'',cantonCode:null,parish:'',parishCode:null,reference:'',coordinates:null},
  soilType:null,irrigationAvailability:'unknown',communityName:'Comunidad de prueba',
}
function setup() {
  let s=applyJournalCommand(emptyJournal(),{id:'c',type:'community',community:{name:'Comunidad de prueba',responsible:'Ana Rivera',location:'Quito',description:''}})
  s=applyJournalCommand(s,{id:'t',type:'terrain',terrain})
  return applyJournalCommand(s,{id:'p',type:'plant-add',plant:{
    id:'manzanilla',name:'Manzanilla',latin:'Matricaria chamomilla',plot:0,date:localDate(),
    photoId:'real-photo-1',photo:'',state:'not-documented',plantedOn:localDate()
  }})
}
function event(gardenId:string,type:GardenActivity['type'],id:string,details:GardenActivity['details']={},target:GardenActivity['target']={kind:'garden'}):GardenActivity {
  return {id,gardenId,type,date:localDate(),responsible:'Ana Rivera',target,notes:'Actividad real registrada con fotos',
    details,photoIds:['evidence-'+id],createdAt:new Date().toISOString(),validation:'local-v1'}
}
test('la bitácora completa mantiene cada etapa del lote sin inventar crecimiento',()=>{
  let s=setup()
  const plantBefore=projectPlants(s)[0]
  const harvest=event(s.gardenId,'harvest','harvest-1',{harvestMode:'partial',quantity:50,unit:'g',plantPart:'flowers'},{kind:'plant',plantId:'manzanilla',plot:0})
  s=applyJournalCommand(s,{id:'h',type:'activity',activity:harvest})
  const basePoints=calculateProgress(s).points
  expect(projectPlants(s)[0].growthStage).toBe(plantBefore.growthStage)
  const clean=event(s.gardenId,'cleaning','clean-1',{sourceHarvestId:harvest.id,method:'Clasificación manual'})
  const dry=event(s.gardenId,'drying','dry-1',{sourceHarvestId:harvest.id,dryingStartOn:localDate(),dryingEndOn:localDate()})
  const pack=event(s.gardenId,'packaging','pack-1',{sourceHarvestId:harvest.id,packagedOn:localDate(),expiryDate:'2027-12-31',labelCommonName:'Manzanilla',labelScientificName:'Matricaria chamomilla',quantity:50,unit:'g'})
  const store=event(s.gardenId,'storage','store-1',{sourceHarvestId:harvest.id,storageLocation:'Estante seco'})
  expect(()=>applyJournalCommand(s,{id:'skip',type:'activity',activity:pack})).toThrow('Registra primero')
  for(const item of [clean,dry,pack,store]) s=applyJournalCommand(s,{id:'cmd-'+item.id,type:'activity',activity:item})
  expect(s.activities).toHaveLength(5)
  expect(statusForHarvestLot(harvest.id,s.activities)).toBeNull()
  expect(projectPlants(s)[0].growthStage).toBe(plantBefore.growthStage)
  expect(projectPlants(s)[0].archivedAt).toBeUndefined()
  expect(calculateProgress(s).points).toBe(basePoints) // La poscosecha nueva no genera puntos no autorizados.
  const replay=applyJournalCommand(s,{id:'cmd-clean-1',type:'activity',activity:clean})
  expect(replay).toBe(s)
  s=applyJournalCommand(s,{id:'void-clean',type:'activity-void',activityId:clean.id,reason:'Limpieza documentada por error',at:new Date().toISOString()})
  expect(s.activities).toHaveLength(5)
  expect(s.activities.find(a=>a.id===clean.id)?.voidedAt).toBeTruthy()
  expect(()=>applyJournalCommand(s,{id:'retry',type:'activity',activity:event(s.gardenId,'drying','another',{sourceHarvestId:harvest.id,dryingStartOn:localDate(),dryingEndOn:localDate()})})).toThrow('Registra primero')
})
