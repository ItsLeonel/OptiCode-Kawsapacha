'use strict'
const test=require('node:test')
const assert=require('node:assert/strict')
const {createInvitationService}=require('../dist/modules/communities/application/invitation.service')
function setup(status='PENDING'){
 const calls=[]
 const invitation={id:'i1',email:'user@example.com',role:'PARTICIPANTE',communityId:'c1',invitedById:'owner',status,createdAt:new Date('2026-11-01')}
 const repo={
  async findPending(){return [{...invitation,community:{id:'c1',name:'Comunidad medicinal',responsible:'Rosa',location:'Quito',description:'Huerto'}}]},
  async findInviters(){return [{id:'owner',name:'Rosa',email:'rosa@example.com'}]},
  async findInvitation(){return invitation},
  async changeStatus(id,next){calls.push(['status',next]);return {...invitation,status:next}},
  async upsertAcceptedMember(communityId,userId,role){calls.push(['member',communityId,userId,role]);return {id:'m',communityId,userId,roleInCommunity:role,status:'ACCEPTED'}},
  async deletePendingMember(communityId,userId){calls.push(['delete-pending',communityId,userId])},
 }
 return {app:createInvitationService(repo),calls}
}
test('invitaciones se filtran por email y muestran invitador real',async()=>{
 const {app}=setup()
 const invitations=await app.getPendingInvitationsForEmail('USER@example.com')
 assert.equal(invitations[0].invitedByName,'Rosa')
 assert.equal(invitations[0].communityName,'Comunidad medicinal')
})
test('aceptar invitación habilita miembro sin cambiar su rol propuesto',async()=>{
 const {app,calls}=setup()
 const accepted=await app.acceptInvitation('i1','user','USER@EXAMPLE.COM')
 assert.equal(accepted.member.status,'ACCEPTED')
 assert.deepEqual(calls.map(x=>x[0]),['status','member'])
})
test('rechazar borra solo membresía pendiente',async()=>{
 const {app,calls}=setup()
 assert.equal((await app.rejectInvitation('i1','user','user@example.com')).rejected,true)
 assert.deepEqual(calls.map(x=>x[0]),['status','delete-pending'])
})
test('invitación ajena y previamente procesada se rechazan',async()=>{
 const {app}=setup()
 await assert.rejects(app.acceptInvitation('i1','user','other@example.com'),e=>e.code==='NOT_FOUND')
 const processed=setup('ACCEPTED').app
 await assert.rejects(processed.acceptInvitation('i1','user','user@example.com'),e=>e.code==='ALREADY_PROCESSED')
})
