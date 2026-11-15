'use strict'
const test=require('node:test')
const assert=require('node:assert/strict')
const {createMemberService}=require('../dist/modules/communities/application/member.service')
function fixture(creator='owner',memberStatus='ACCEPTED') {
 const calls=[]
 const repository={
  async getCreatorId(){return creator},
  async getMember(id,uid){return {id:'m1',communityId:id,userId:uid,roleInCommunity:'PARTICIPANTE',status:memberStatus}},
  async findUserByEmails(email){return {id:'u2',email}},
  async updateMembershipPending(id,role){calls.push(['pending',id,role])},
  async createMembershipPending(id,user,role){calls.push(['new-pending',id,user,role])},
  async findPendingInvitation(){return null},
  async createInvitation(communityId,email,role,invitedById){return {id:'inv',communityId,email,role,invitedById,status:'PENDING'}},
  async updatePendingInvitation(){return {}},
  async listMembers(){return []},
  async updateMemberRole(communityId,userId,role){calls.push(['role',role]);return {id:'m',communityId,userId,roleInCommunity:role,status:'ACCEPTED'}},
  async findUserById(id){return {id,email:'u@example.com'}},
  async updatePendingInvitationRoles(communityId,email,role){calls.push(['sync-role',role])},
  async deleteInvitationsForEmail(){calls.push(['delete-invitations'])},
  async deleteMember(){calls.push(['delete-member']);return {id:'m'}},
 }
 return {service:createMemberService(repository),calls}
}
test('creador de comunidad tiene rol Responsable independientemente de membresía',async()=>{
 const {service}=fixture()
 assert.equal(await service.isCommunityResponsable('c','owner'),true)
 assert.equal(await service.isCommunityResponsable('c','other'),false)
})
test('invitación pendiente conserva normalización y no autoacepta miembro',async()=>{
 const {service,calls}=fixture('owner','PENDING')
 const i=await service.inviteMember('c',' User@EPN.EDU.EC ','PARTICIPANTE','owner')
 assert.equal(i.email,'user@epn.edu.ec')
 assert.equal(i.status,'PENDING')
 assert.equal(calls[0][0],'pending')
})
test('se rechaza modificar miembros sin ser Responsable',async()=>{
 const {service}=fixture()
 await assert.rejects(service.removeMember('c','member','outsider'),e=>e.code==='FORBIDDEN')
 await assert.rejects(service.updateMemberRole('c','member','RESPONSABLE','outsider'),e=>e.code==='FORBIDDEN')
})
