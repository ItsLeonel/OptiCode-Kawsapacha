'use strict'
/**
 * Reglas estáticas mínimas de arquitectura, sin dependencias adicionales.
 * La migración es gradual: valida de forma estricta los dominios ya extraídos
 * sin exigir todavía que todos los servicios heredados sean puros.
 */
const fs = require('node:fs')
const path = require('node:path')

const modulesRoot = path.resolve(__dirname, '../src/modules')
const forbiddenPackages = /^(?:@prisma\/client|express|cors|helmet|multer|fs|node:fs(?:\/.*)?|node:path(?:\/.*)?|path)$/
let inspected = 0
const errors = []
const directDependencies = new Map()

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(file)
    else if (entry.isFile() && /\.tsx?$/.test(file)) analyze(file)
  }
}

function analyze(file) {
  const content = fs.readFileSync(file, 'utf8')
  const relative = path.relative(modulesRoot, file).replaceAll('\\', '/')
  const moduleName = relative.split('/')[0]
  const domain = relative.includes('/domain/')
  const isolatedApplication = relative.startsWith('catalog/application/') || relative === 'administration/application/admin-msp-community.service.ts' || relative.startsWith('gardens/application/') || relative === 'activities/application/activity-query.service.ts' || relative === 'activities/application/activity-void.service.ts' || relative === 'activities/application/care.service.ts' || relative === 'activities/application/activity-registration.service.ts' || relative === 'harvest/application/harvest.service.ts' || relative.startsWith('communities/application/community.service') || relative.startsWith('communities/application/member.service') || relative.startsWith('communities/application/invitation.service') || relative === 'plants/application/plant-query.service.ts' || relative === 'plants/application/plant-registration.service.ts' || relative === 'plants/application/plant-update.service.ts' || relative === 'plants/application/plant-lifecycle.service.ts' || relative.startsWith('notifications/application/') || relative === 'administration/application/admin-msp-content.service.ts' || relative === 'administration/application/admin-technical.service.ts' || relative.startsWith('auth/application/') || relative.startsWith('rewards/application/') || relative === 'administration/application/audit.service.ts'
  const matches = content.matchAll(/(?:\bfrom\s*|\brequire\s*\(|\bimport\s*\()\s*['"]([^'"]+)['"]/g)
  for (const match of matches) {
    const spec = match[1]
    if (domain && (forbiddenPackages.test(spec) || /(?:^|\/)(?:infrastructure|application|presentation|middlewares)(?:\/|$)/.test(spec))) {
      errors.push(relative + ' depende de ' + spec)
    }
    if (isolatedApplication && (forbiddenPackages.test(spec) || /(?:^|\/)(?:infrastructure|presentation)(?:\/|$)/.test(spec))) {
      errors.push(relative + ' depende de ' + spec)
    }
    if (spec.startsWith('.')) {
      const target = path.resolve(path.dirname(file), spec)
      const resolved = path.relative(modulesRoot, target).replaceAll('\\', '/')
      const targetModule = resolved.split('/')[0]
      if (!resolved.startsWith('..') && targetModule !== moduleName) {
        const edge = moduleName + ' -> ' + targetModule
        directDependencies.set(edge, (directDependencies.get(edge) || 0) + 1)
      }
    }
  }
  if (domain) inspected++
}


/** Reporte informativo: componentes fuertemente conexas en el grafo entre módulos. */
function findModuleCycles(importEdges) {
  const graph = new Map()
  for (const edge of importEdges.keys()) {
    const [from, to] = edge.split(' -> ')
    if (!graph.has(from)) graph.set(from, new Set())
    if (!graph.has(to)) graph.set(to, new Set())
    graph.get(from).add(to)
  }

  let nextIndex = 0
  const indices = new Map()
  const lowest = new Map()
  const stack = []
  const active = new Set()
  const cycles = []

  function visit(node) {
    indices.set(node, nextIndex)
    lowest.set(node, nextIndex)
    nextIndex++
    stack.push(node)
    active.add(node)

    for (const next of graph.get(node) || []) {
      if (!indices.has(next)) {
        visit(next)
        lowest.set(node, Math.min(lowest.get(node), lowest.get(next)))
      } else if (active.has(next)) {
        lowest.set(node, Math.min(lowest.get(node), indices.get(next)))
      }
    }

    if (lowest.get(node) === indices.get(node)) {
      const group = []
      let value
      do {
        value = stack.pop()
        active.delete(value)
        group.push(value)
      } while (value !== node)
      if (group.length > 1) cycles.push(group.sort())
    }
  }

  for (const moduleName of graph.keys()) {
    if (!indices.has(moduleName)) visit(moduleName)
  }
  return cycles.sort((a, b) => a.join(',').localeCompare(b.join(',')))
}

walk(modulesRoot)
console.log('Dominios TypeScript comprobados: ' + inspected)
console.log('Referencias entre módulos (línea base, no umbral): ' + [...directDependencies.values()].reduce((a,b)=>a+b,0))
const cycles = findModuleCycles(directDependencies)
console.log('Grupos de dependencias circulares entre módulos: ' + cycles.length)
for (const cycle of cycles) {
  console.log('  Ciclo: ' + cycle.join(' <-> '))
  errors.push('Dependencia circular entre módulos: ' + cycle.join(' <-> '))
}
if (errors.length) {
  console.error('Violaciones de las reglas del dominio:\n' + errors.join('\n'))
  process.exitCode = 1
} else {
  console.log('OK: los dominios extraídos no dependen de infraestructura, aplicación ni HTTP.')
}
