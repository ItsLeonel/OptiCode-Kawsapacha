'use strict'
const test=require('node:test')
const assert=require('node:assert/strict')
const {createCareService}=require('../dist/modules/activities/application/care-implementation')
const species={name:'Romero',wateringFrequencyDays:3,fertilizerFrequencyDays:30,growthCycleDays:45,bestPlantingSeason:'Todo el año',lunarPhaseTip:'Cuarto creciente'}
test('consulta orientativa preserva frecuencias reales de catálogo',async()=>{
 const repository={async findSpecies(){return {id:'romero',...species}}}
 const app=createCareService(repository)
 const tips=await app.getCalendarTips('romero')
 assert.equal(tips.wateringFrequencyDays,3)
 assert.equal(tips.fertilizerFrequencyDays,30)
 assert.equal(tips.bestPlantingSeason,'Todo el año')
})
test('sin planta no crea registro de cuidado',async()=>{
 let created=false
 const repository={async findForValidation(){return null},async createLog(){created=true}}
 const app=createCareService(repository)
 await assert.rejects(app.addCareLog('p','WATERING','Prueba','u'),/Planta no encontrada/)
 assert.equal(created,false)
})
test('lista de cuidados delega lectura al repositorio',async()=>{
 const repository={async listLogs(id){return [{id,actionType:'WATERING'}]}}
 const app=createCareService(repository)
 assert.deepEqual((await app.getCareLogs('p')).map(l=>l.actionType),['WATERING'])
})
