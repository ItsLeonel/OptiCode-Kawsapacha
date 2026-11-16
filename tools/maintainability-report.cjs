'use strict'
// Reporte reproducible de tamaño y dependencias estáticas para la revisión de mantenibilidad.
// No mide cobertura, duplicación semántica ni comportamiento en ejecución.
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

function listSource(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name)
    return entry.isDirectory() ? listSource(absolute) : entry.isFile() && /\.tsx?$/.test(entry.name) ? [absolute] : []
  })
}

function describeSource(base, kind) {
  const files = listSource(path.join(root, base))
  const summaries = files.map(file => {
    const source = fs.readFileSync(file, 'utf8')
    const rel = path.relative(root, file).replaceAll('\\', '/')
    const segments = rel.split('/')
    const layerName = kind === 'backend' ? 'modules' : 'features'
    const pos = segments.indexOf(layerName)
    const moduleName = pos === -1 ? null : segments[pos + 1]
    return { absolute: file, path: rel, module: moduleName, lines: source.split('\n').length, source }
  })

  const modules = [...new Set(summaries.map(x => x.module).filter(Boolean))].sort()
  const directImports = []
  const fileDependencies = []
  const infraInApplication = []
  for (const file of summaries) {
    if (kind === 'backend' && /\/application\//.test(file.path) &&
        /(?:from|require\s*\()\s*['"][^'"]*(?:infrastructure\/database\/prisma|@prisma\/client)/.test(file.source)) {
      infraInApplication.push(file.path)
    }
    const imports = file.source.matchAll(/(?:\bfrom\s*|\brequire\s*\(\s*|\bimport\s*\(\s*)['"]([^'"]+)['"]/g)
    for (const match of imports) {
      const spec = match[1]
      if (!spec.startsWith('.')) continue
      const resolved = path.resolve(path.dirname(file.absolute), spec)
      const segments = path.relative(root, resolved).replaceAll('\\', '/').split('/')
      const toIndex = segments.indexOf(kind === 'backend' ? 'modules' : 'features')
      const toModule = toIndex === -1 ? null : segments[toIndex + 1]
      if (file.module && toModule && file.module !== toModule) {
        directImports.push({ from: file.module, to: toModule, file: file.path })
      }
      if (kind === 'frontend' && file.path.startsWith('frontend/src/shared/') && segments.includes('features')) {
        fileDependencies.push({ source: file.path, target: spec })
      }
    }
  }
  const uniqueEdges = [...new Set(directImports.map(x => x.from + ' -> ' + x.to))].sort()
  return {
    files: files.length,
    totalPhysicalLines: summaries.reduce((sum,x) => sum + x.lines, 0),
    modules,
    moduleCount: modules.length,
    directCrossModuleImports: directImports.length,
    distinctCrossModuleEdges: uniqueEdges,
    topLargestFiles: summaries.sort((a,b)=>b.lines-a.lines).slice(0,10).map(x=>({file:x.path,lines:x.lines})),
    ...(kind === 'backend' ? {applicationFilesImportingPrismaDirectly:infraInApplication} : {sharedFilesImportingFeatures: fileDependencies}),
  }
}

const report = {
  methodology: 'Estática: importaciones relativas y líneas físicas TypeScript (incluye comentarios y vacías). No equivale a análisis SonarQube.',
  backend: describeSource('backend/src', 'backend'),
  frontend: describeSource('frontend/src', 'frontend'),
}
console.log(JSON.stringify(report, null, 2))
