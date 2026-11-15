'use strict'
const test=require('node:test'),assert=require('node:assert/strict')
const {createPlantRegistrationService}=require('../dist/modules/plants/application/plant-registration.service')
const {createPlantUpdateService}=require('../dist/modules/plants/application/plant-update.service')
function fixtures(){
 const actions=[]
 let plant={id:'p1',realGardenId:'g',plotIndex:2,notes:'Inicial',observedState:'growing'}
 const repository={
  async findPlot(){return null},async archiveHarvested(){},
  async findSpecies(){return {name:'Romero'}},
  async createPlant(data){actions.push(['create-plant',data]);return {...plant,...data,species:{name:'Romero'},realGarden:{id:'g',name:'Huerto',province:'Pichincha'}}},
  async getPlantForUpdate(){return {...plant}},
  async getGrowthActivities(){return []},
  async updatePlant(id,data){plant={...plant,...data};actions.push(['update-plant',data]);return {...plant,photoUrl:data.photoUrl??'/uploads/plants/old.jpg'}},
  async createActivity(data){actions.push(['activity',data]);return {id:'activity1'}},
  async createEvidence(data){actions.push(['evidence',data]);return data},
 }
 const services={
  async assertGardenAccess(){return true},
  async evaluateActivityReward(){actions.push(['reward']);return {}},
  async syncUserMissionsAndBadges(){actions.push(['missions']);return {}},
  basename(filename){return filename.split('/').at(-1)},
 }
 return {repository,services,actions}
}
test('registro de planta conserva foto, siembra en Bitácora y recompensas',async()=>{
 const {repository,services,actions}=fixtures()
 const {registerPlant}=createPlantRegistrationService(repository,services)
 const plant=await registerPlant({
  realGardenId:'g',speciesId:'s1',plotIndex:2,customName:'Romero',notes:'Plantado',
  plantedOn:'2026-10-29',registeredById:'u',file:{path:'/tmp/romero.jpg',mimetype:'image/jpeg',size:123},
 })
 assert.equal(plant.photoUrl,'/uploads/plants/romero.jpg')
 assert.equal(actions.find(x=>x[0]==='activity')[1].type,'sowing')
 assert.equal(actions.find(x=>x[0]==='evidence')[1].fileUrl,'/uploads/plants/romero.jpg')
 assert.equal(actions.filter(x=>x[0]==='reward').length,1)
})
test('actualización sin nueva foto rechaza cambios de estado observado',async()=>{
 const {repository,services}=fixtures()
 const {updatePlantDetails}=createPlantUpdateService(repository,services)
 await assert.rejects(updatePlantDetails({plantId:'p1',requestingUserId:'u',observedState:'flowering'}),e=>e.code==='EVIDENCE_REQUIRED')
})
test('actualización con foto documenta evidencia real y recompensa',async()=>{
 const {repository,services,actions}=fixtures()
 const {updatePlantDetails}=createPlantUpdateService(repository,services)
 const value=await updatePlantDetails({plantId:'p1',requestingUserId:'u',observedState:'flowering',notes:'Observación',file:{path:'/tmp/nuevo.jpg',mimetype:'image/jpeg',size:456}})
 assert.equal(value.photoUrl,'/uploads/plants/nuevo.jpg')
 assert.equal(actions.find(x=>x[0]==='activity')[1].type,'observation')
 assert.equal(actions.find(x=>x[0]==='evidence')[1].fileUrl,'/uploads/plants/nuevo.jpg')
})
