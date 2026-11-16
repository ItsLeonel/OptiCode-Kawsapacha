'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const mounts = require('./fixtures/api-route-mounts-v1.json')

test('el router del monolito modular conserva los 20 puntos públicos de montaje V1 en orden',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../src/app/router.ts'),'utf8')
  const observed=source.split('\n')
    .map(line=>line.trim())
    .filter(line=>/^router\.(use|get|post|patch|put|delete)\(/.test(line))
    .map(line=>{
      const match=line.match(/^router\.(use|get|post|patch|put|delete)\(['"]([^'"]+)['"]/)
      assert.ok(match,'No se pudo identificar el punto de montaje de API: '+line)
      return match[1].toUpperCase()+' '+match[2]
    })
  assert.deepEqual(observed,mounts)
})
