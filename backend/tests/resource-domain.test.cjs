'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { createResourceService } = require('../dist/modules/harvest/application/resource.service')

test('Recursos: casos de uso inyectables conservan cada operación y sus argumentos', async () => {
  const calls = []
  const repository = {
    async findMany(id) { calls.push(['list', id]); return [] },
    async create(id, data) { calls.push(['create', id, data]); return {id:'r', ...data} },
    async update(id, data) { calls.push(['update', id, data]); return {id, ...data} },
    async delete(id) { calls.push(['delete', id]); return {id} },
  }
  const service = createResourceService(repository)
  const fields = { name:'Pala', category:'Herramientas', quantity:2, unit:'unidades', status:'DISPONIBLE', description:'' }
  assert.deepEqual(await service.listResources('c'), [])
  assert.equal((await service.createResource('c', fields)).id, 'r')
  assert.equal((await service.updateResource('r', {quantity:3})).quantity, 3)
  assert.equal((await service.deleteResource('r')).id, 'r')
  assert.deepEqual(calls.map(call=>call[0]), ['list','create','update','delete'])
  assert.equal(calls[1][1], 'c')
})
