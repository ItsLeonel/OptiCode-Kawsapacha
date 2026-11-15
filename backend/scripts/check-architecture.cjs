'use strict'
/**
 * Guardia de dependencias, Node.js 22.
 * No exige una migración Big Bang de los servicios heredados.
 * Bloquea nuevas dependencias de infraestructura/HTTP en todo dominio.
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../src/modules')
const violations = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(absolute)
    else if (entry.isFile() && entry.name.endsWith('.ts')) checkFile(absolute)
  }
}

function checkFile(file) {
  const relative = path.relative(root, file).replaceAll('\\', '/')
  const content = fs.readFileSync(file, 'utf8')
  const isDomain = relative.includes('/domain/')
  const isCatalogApplication = relative.startsWith('catalog/application/')
  if (!isDomain && !isCatalogApplication) return

  const imports = content.matchAll(/(?:\bfrom\s*|\brequire\s*\(\s*|\bimport\s*\(\s*)['"]([^'"]+)['"]/g)
  for (const match of imports) {
    const dependency = match[1]
    if (!dependency) continue
    const forbiddenDomain =
      dependency === 'express' ||
      dependency === '@prisma/client' ||
      dependency.startsWith('node:fs') ||
      dependency.startsWith('node:path') ||
      dependency.startsWith('node:child_process') ||
      /(?:^|\/)(?:infrastructure|presentation|application)(?:\/|$)/.test(dependency)
    const forbiddenApplication =
      dependency === 'express' ||
      dependency === '@prisma/client' ||
      /(?:^|\/)(?:infrastructure|presentation)(?:\/|$)/.test(dependency)
    if ((isDomain && forbiddenDomain) || (isCatalogApplication && forbiddenApplication)) {
      violations.push(relative + ': prohibido importar ' + dependency)
    }
  }
}

walk(root)
if (violations.length) {
  console.error('Violaciones de dependencia arquitectónica:\n' + violations.join('\n'))
  process.exitCode = 1
} else {
  console.log('Módulos verificados: dominio independiente y catálogo sin dependencias de infraestructura.')
}
