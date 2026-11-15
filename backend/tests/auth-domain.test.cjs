'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { normalizeAuthEmail, normalizeGlobalRole } = require('../dist/modules/auth/domain/auth-rules')

test('Autenticación: normalización y roles válidos se mantienen', () => {
  assert.equal(normalizeAuthEmail('  Ana@EJEMPLO.COM '), 'ana@ejemplo.com')
  assert.equal(normalizeGlobalRole('ADMIN_MSP'), 'ADMIN_MSP')
  assert.equal(normalizeGlobalRole('ADMIN_TECNICO'), 'ADMIN_TECNICO')
  assert.equal(normalizeGlobalRole('RESPONSABLE'), 'USUARIO')
  assert.equal(normalizeGlobalRole('otro'), 'USUARIO')
})
