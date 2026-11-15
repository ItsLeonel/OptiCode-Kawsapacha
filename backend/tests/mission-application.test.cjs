'use strict'
const test=require('node:test'),assert=require('node:assert/strict')
const {createMissionService}=require('../dist/modules/rewards/application/missions.service')
test('progreso de misiones se calcula solo sobre actividades aprobadas con evidencias',async()=>{
 const activities=[
  {type:'watering',performedDate:'2026-11-01',evidences:[]},
  {type:'watering',performedDate:'2026-11-02',evidences:[]},
  {type:'watering',performedDate:'2026-11-03',evidences:[]},
  {type:'observation',performedDate:'2026-11-04',evidences:[{id:'e'}]},
  {type:'sowing',performedDate:'2026-11-05',evidences:[{id:'s'}]},
 ]
 const badges=[],missions=[],ledger=[]
 const repo={
  async listApprovedActivities(){return activities},
  async deleteBadge(uid,badgeId){const i=badges.findIndex(x=>x.badgeId===badgeId);if(i>=0)badges.splice(i,1)},
  async listBadges(){return badges},async listMissions(){return missions},
  async findMission(uid,id){return missions.find(x=>x.missionId===id)??null},
  async createMission(data){missions.push({id:'m'+missions.length,...data})},
  async updateMission(id,data){Object.assign(missions.find(x=>x.id===id),data)},
  async getMissionLedger(uid,id){return ledger.filter(x=>x.sourceId===id)},
  async createLedger(data){ledger.push({id:'l'+ledger.length,...data,reversalOfLedgerId:data.reversalOfLedgerId??null})},
  async findBadge(uid,badgeId){return badges.find(x=>x.badgeId===badgeId)??null},
  async createBadge(uid,badgeId){badges.push({id:'b'+badges.length,badgeId,earnedAt:new Date()})},
 }
 const {syncUserMissionsAndBadges}=createMissionService(repo,()=>({recommendations:[]}))
 const result=await syncUserMissionsAndBadges('user')
 assert.ok(result.badges.some(x=>x.badgeId==='care'))
 assert.ok(result.badges.some(x=>x.badgeId==='first-sowing'))
 assert.equal(result.missions.find(x=>x.missionId==='care').completed,true)
 assert.equal(ledger.filter(x=>x.pointsDelta>0).length,1)
 await syncUserMissionsAndBadges('user')
 assert.equal(ledger.filter(x=>x.pointsDelta>0).length,1)
})
