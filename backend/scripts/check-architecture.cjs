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
  const matches = content.matchAll(/(?:\bfrom\s*|\brequire\s*\(|\bimport\s*\()\s*['"]([^'"]+)['"]/g)
  for (const match of matches) {
    const spec = match[1]
    if (domain && (forbiddenPackages.test(spec) || /(?:^|\/)(?:infrastructure|application|presentation|middlewares)(?:\/|$)/.test(spec))) {
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

walk(modulesRoot)
console.log('Dominios TypeScript comprobados: ' + inspected)
console.log('Referencias entre módulos (línea base, no umbral): ' + [...directDependencies.values()].reduce((a,b)=>a+b,0))
if (errors.length) {
  console.error('Violaciones de las reglas del dominio:\n' + errors.join('\n'))
  process.exitCode = 1
} else {
  console.log('OK: los dominios extraídos no dependen de infraestructura, aplicación ni HTTP.')
}
