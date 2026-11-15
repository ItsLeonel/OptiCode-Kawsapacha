'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { createAuthService } = require('../dist/modules/auth/application/auth.service')

function service() {
  const users=[]
  const repository={
    async findByEmails(normalized,trimmed) { return users.find(u=>u.email===normalized || u.email===trimmed)??null },
    async create(data) { const user={id:'u'+(users.length+1),...data};users.push(user);return user },
    async findById(id) { return users.find(u=>u.id===id)??null },
  }
  const hasher={
    async hash(password,saltRounds) { assert.equal(saltRounds,10); return 'hashed:'+password },
    async compare(password,hash) { return 'hashed:'+password===hash },
  }
  const tokens={ sign(payload) { return [payload.userId,payload.email,payload.role].join('|') } }
  return { service:createAuthService(repository,hasher,tokens),users }
}

test('registro conserva normalización, rol USUARIO y error de duplicados',async()=>{
  const {service:auth}=service()
  const {user,token}=await auth.registerUser('  Rosa  ',' ROSA@EXAMPLE.COM ','clave')
  assert.equal(user.name,'Rosa')
  assert.equal(user.email,'rosa@example.com')
  assert.equal(user.role,'USUARIO')
  assert.equal(token,'u1|rosa@example.com|USUARIO')
  await assert.rejects(auth.registerUser('Rosa','rosa@example.com','otra'),e=>e.code==='EMAIL_IN_USE')
})

test('login mantiene error genérico, rechazo a cuenta inactiva y roles',async()=>{
  const {service:auth,users}=service()
  await auth.registerUser('Rosa','rosa@example.com','clave')
  await assert.rejects(auth.loginUser('rosa@example.com','incorrecta'),e=>e.code==='INVALID_CREDENTIALS')
  users[0].role='ADMIN_MSP'
  const logged=await auth.loginUser('Rosa@Example.com','clave')
  assert.equal(logged.user.role,'ADMIN_MSP')
  assert.equal(logged.token,'u1|rosa@example.com|ADMIN_MSP')
  users[0].isActive=false
  await assert.rejects(auth.loginUser('rosa@example.com','clave'),e=>e.code==='ACCOUNT_DEACTIVATED')
  assert.equal((await auth.getUserById('u1')).isActive,false)
})
