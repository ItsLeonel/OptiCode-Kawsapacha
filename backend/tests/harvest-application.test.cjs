'use strict'
const test=require('node:test')
const assert=require('node:assert/strict')
const {createHarvestService}=require('../dist/modules/harvest/application/harvest.service')

function setup(communityId='comm',existingResource=null){
 const calls=[]
 const repository={
  async findPlant(id){calls.push(['find-plant',id]);return {realGardenId:'garden',species:{name:'Romero',latinName:'Salvia rosmarinus'}}},
  async findGarden(id){calls.push(['find-garden',id]);return {id,communityId,createdById:'creator'}},
  async findAcceptedMembership(id){calls.push(['membership',id]);return null},
  async findCreatedCommunity(ids){calls.push(['creator-community',ids]);return 'created-comm'},
  async linkGarden(id,cid){calls.push(['link',id,cid])},
  async createHarvest(data){calls.push(['harvest',data]);return {id:'h1',...data,harvestDate:new Date()}},
  async findResource(cid,name){calls.push(['find-resource',cid,name]);return existingResource},
  async incrementResource(id,quantity,unit,description){calls.push(['increment',id,quantity,unit,description])},
  async createResource(data){calls.push(['new-resource',data])},
  async markPlantRegrowing(id,date){calls.push(['regrowing',id,date])},
  async listByGarden(id){calls.push(['list-garden',id]);return []},
  async listByCommunity(id){calls.push(['list-community',id]);return []},
 }
 return {service:createHarvestService(repository),calls}
}
test('cosecha registra cantidad, inventario y rebrote sin tocar Prisma',async()=>{
 const {service,calls}=setup()
 const record=await service.harvestPlant('plant','3.4 atados','Cosecha saludable','user')
 assert.equal(record.speciesName,'Romero')
 const resource=calls.find(x=>x[0]==='new-resource')
 assert.equal(resource[1].quantity,3)
 assert.equal(resource[1].unit,'atados')
 assert.equal(resource[1].communityId,'comm')
 assert.equal(calls.at(-1)[0],'regrowing')
 assert.ok(calls.at(-1)[2] instanceof Date)
})
test('se incrementa recurso previo en vez de duplicarlo',async()=>{
 const {service,calls}=setup('comm',{id:'resource',unit:'porción'})
 await service.harvestPlant('plant','500g','Conservada','user')
 const incr=calls.find(x=>x[0]==='increment')
 assert.deepEqual(incr.slice(0,4),['increment','resource',500,'g'])
 assert.equal(calls.some(x=>x[0]==='new-resource'),false)
})
test('cosecha en huerto sin comunidad mantiene secuencia de búsqueda y vinculación',async()=>{
 const {service,calls}=setup(null)
 await service.harvestPlant('plant','2','Observada','user')
 assert.deepEqual(calls.filter(x=>x[0]==='membership').map(x=>x[1]),['user','creator'])
 assert.deepEqual(calls.find(x=>x[0]==='creator-community'),['creator-community',['user','creator']])
 assert.deepEqual(calls.find(x=>x[0]==='link'),['link','garden','created-comm'])
})
test('listado se delega por huerto y comunidad',async()=>{
 const {service,calls}=setup()
 assert.deepEqual(await service.listHarvestsByGarden('garden'),[])
 assert.deepEqual(await service.listHarvestsByCommunity('comm'),[])
 assert.equal(calls[0][0],'list-garden')
 assert.equal(calls[1][0],'list-community')
})
