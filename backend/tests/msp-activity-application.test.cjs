'use strict'
const test=require('node:test'),assert=require('node:assert/strict')
const {createMspActivityService}=require('../dist/modules/administration/application/admin-msp-activity.service')
function fixture(status='PENDING'){
 const actions=[]
 const activity={id:'a',actorUserId:'u',type:'watering',performedDate:'2026-11-15',targetKind:'plant',plantId:null,plotIndex:1,reviewStatus:status,reviewedAt:null,voidedAt:null}
 const repository={
  async count(){return 1},async findMany(){return [activity]},
  async findForReview(){return {...activity}},
  async approveIfUnchanged(){actions.push('approved');return {count:1}},
  async getUpdated(){return {...activity,reviewStatus:'APPROVED'}},
  async updatePlantReview(){actions.push('plant')},
  async requestChanges(){actions.push('changes');return {...activity,reviewStatus:'NEEDS_CHANGES'}},
  async rejectWithReversal(){actions.push('transaction-reversal');return {updated:{...activity,reviewStatus:'REJECTED'},pointsReverted:-5}},
 }
 const services={
  async logAudit(){actions.push('audit')},async createNotification(){actions.push('notification')},
  async evaluateActivityReward(){actions.push('evaluate');return {awarded:false,pointsAwarded:0,totalPoints:25,level:'Aprendiz',reason:'Ya registrada'}},
  async getUserRewardsSummary(){return {points:25,level:'Aprendiz'}},
  async syncUserMissionsAndBadges(){actions.push('missions')},
  async calculateGrowth(){actions.push('growth')},
 }
 return {service:createMspActivityService(repository,services),actions}
}
test('MSP: aprobación, auditoría y aviso no duplican recompensas',async()=>{
 const {service,actions}=fixture()
 const result=await service.reviewActivity('a','APPROVED','msp')
 assert.equal(result.reward.pointsAwarded,0)
 assert.equal(result.activity.reviewStatus,'APPROVED')
 assert.deepEqual(actions,['approved','evaluate','missions','audit','notification'])
})
test('MSP: rechazo delega estado y reversión atómica a infraestructura',async()=>{
 const {service,actions}=fixture('APPROVED')
 const result=await service.reviewActivity('a','REJECTED','msp','Evidencia inválida')
 assert.equal(result.pointsReverted,-5)
 assert.deepEqual(actions,['transaction-reversal','missions','audit','notification'])
})
test('MSP: errores funcionales conservan validación',async()=>{
 const {service}=fixture()
 await assert.rejects(service.reviewActivity('a','NEEDS_CHANGES','msp','no'),e=>e.code==='VALIDATION_ERROR')
})
