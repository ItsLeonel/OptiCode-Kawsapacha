'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { createAuditService } = require('../dist/modules/administration/application/audit.service')
const { decodeAuditDetails } = require('../dist/modules/administration/domain/audit')

test('normalización de auditoría sin BD: paginación, filtros y detalle JSON', async () => {
  const query=[]
  const fixture={id:'entry',actorId:'admin',action:'REVIEW',targetResource:'plant',targetId:'p',details:'{"status":"APPROVED"}',ipAddress:null,timestamp:new Date('2026-11-01T00:00:00Z'),actor:{id:'admin',name:'MSP',email:'user@example.test',role:'ADMIN_MSP'}}
  const repository={
    async create(data){return {...fixture,...data}},
    async count(where){query.push(where);return 45},
    async findMany(where,skip,take){query.push([where,skip,take]);return [fixture]},
  }
  const result=await createAuditService(repository).listAuditLogs({page:2,limit:3,action:'REVIEW',actorId:'admin'})
  assert.equal(result.totalPages,15)
  assert.equal(result.page,2)
  assert.deepEqual(query[0],{actorId:'admin',action:'REVIEW'})
  assert.deepEqual(query[1],[{actorId:'admin',action:'REVIEW'},3,3])
  assert.deepEqual(result.logs[0].details,{status:'APPROVED'})
  assert.deepEqual(decodeAuditDetails('valor inválido'),{})
})

test('error al persistir auditoría no rompe operación principal',async()=>{
  const repo={async create(){throw new Error('sin BD')},async count(){return 0},async findMany(){return []}}
  const original=console.error
  console.error=()=>{}
  try {assert.equal(await createAuditService(repo).logAudit({actorId:'a',action:'X',targetResource:'r',targetId:'id'}),null)}
  finally {console.error=original}
})
