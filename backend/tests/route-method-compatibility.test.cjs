'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

// Contratos de métodos y rutas cotejados con main e9ef2a6d; no solo puntos de montaje.
const baseline = {
  "activities/presentation/activity": [
    "POST /",
    "GET /",
    "GET /:activityId",
    "POST /:activityId/void"
  ],
  "administration/presentation/admin": [
    "USE /technical",
    "USE /msp"
  ],
  "auth/presentation/auth": [
    "POST /register",
    "POST /login",
    "GET /me"
  ],
  "activities/presentation/care": [
    "GET /",
    "POST /",
    "GET /growth"
  ],
  "catalog/presentation/catalog": [
    "GET /",
    "GET /:id"
  ],
  "communities/presentation/community": [
    "GET /",
    "POST /",
    "GET /:id",
    "PUT /:id"
  ],
  "gardens/presentation/garden": [
    "GET /",
    "POST /",
    "GET /:id",
    "PUT /:id"
  ],
  "plants/presentation/garden-plant": [
    "GET /:gardenId/plants",
    "POST /:gardenId/plants"
  ],
  "communities/presentation/invitation": [
    "GET /me",
    "GET /",
    "POST /:id/accept",
    "POST /:id/reject"
  ],
  "lunar-calendar/presentation/lunar-calendar": [
    "GET /"
  ],
  "communities/presentation/member": [
    "GET /",
    "POST /invite",
    "PATCH /:userId/role",
    "DELETE /:userId"
  ],
  "notifications/presentation/notification": [
    "GET /",
    "PATCH /read-all",
    "DELETE /read",
    "PATCH /:id/read"
  ],
  "plants/presentation/plant": [
    "GET /:id/passport",
    "PATCH /:id",
    "PATCH /:id/archive",
    "DELETE /:id"
  ],
  "harvest/presentation/resource": [
    "GET /",
    "POST /",
    "PATCH /:resourceId",
    "DELETE /:resourceId"
  ],
  "rewards/presentation/rewards": [
    "GET /rewards"
  ],
  "users/presentation/user": [
    "GET /lookup"
  ]
}
const root = path.join(__dirname, '../src/modules')
function routesIn(file) {
 const source = fs.readFileSync(file, 'utf8')
 return Array.from(source.matchAll(/\brouter\.(get|post|put|patch|delete|use)\(\s*['"`]([^'"`]+)['"`]/g),
  m => m[1].toUpperCase()+' '+m[2])
}
test('cada subrouter conserva método, ruta y orden del contrato base', () => {
 for (const [modulePath, expected] of Object.entries(baseline)) {
  const actual = routesIn(path.join(root, modulePath + '.routes.ts'))
  assert.deepEqual(actual, expected, modulePath)
 }
})
test('cosechas mantienen los tres routers separados con permisos y métodos', () => {
 const content=fs.readFileSync(path.join(root, 'harvest/presentation/harvest.routes.ts'), 'utf8')
 const observed=Array.from(content.matchAll(/\b(plantHarvestRouter|gardenHarvestRouter|communityHarvestRouter)\.(post|get|patch|put|delete)\(\s*['"`]([^'"`]+)['"`]/g),
  m => m[1]+' '+m[2].toUpperCase()+' '+m[3])
 assert.deepEqual(observed, [
  'plantHarvestRouter POST /',
  'gardenHarvestRouter GET /',
  'communityHarvestRouter GET /',
 ])
 assert.match(content, /plantHarvestRouter\.post\('\/',\s*requireAuth,\s*requireHarvestRole,\s*harvestPlant\)/)
})
test('composición anidada mantiene plantas bajo /gardens sin alterar paths', () => {
 const content=fs.readFileSync(path.join(__dirname,'../src/app/garden-router.ts'), 'utf8')
 assert.match(content,/router\.use\('\/',\s*gardenRoutes\)/)
 assert.match(content,/router\.use\('\/',\s*gardenPlantRoutes\)/)
})
