'use strict'
/**
 * Auditoría conservadora de activos versionados: NO elimina archivos.
 * Las rutas dinámicas de Phaser/Vite pueden requerir inspección manual.
 */
const fs=require('node:fs')
const path=require('node:path')
const {execFileSync}=require('node:child_process')
const root=path.resolve(__dirname,'..')
const tracked=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'})
  .split('\0').filter(Boolean)
const imageExt=/\.(?:png|jpe?g|webp|svg|gif|avif)$/i
const textExt=/\.(?:tsx?|jsx?|cjs|mjs|css|scss|html|md|json|ya?ml)$/i
const assets=tracked.filter(x=>imageExt.test(x))
const sources=tracked.filter(x=>textExt.test(x)&&!x.startsWith('backend/node_modules/')&&!x.startsWith('frontend/node_modules/'))
const texts=[]
for(const src of sources) {
  try { texts.push([src,fs.readFileSync(path.join(root,src),'utf8')]) }
  catch { /* Informe best-effort; nunca borrar por error de lectura. */ }
}
const results=assets.map(asset=>{
 const name=path.posix.basename(asset)
 const refs=texts.filter(([src,txt])=>src!==asset&&txt.includes(name)).map(([src])=>src)
 const runtimeRefs=refs.filter(ref=>ref.startsWith('frontend/src/')||ref.startsWith('frontend/public/'))
 const docsRefs=refs.filter(ref=>ref.startsWith('docs/')||ref.endsWith('README.md'))
 return {file:asset,size:fs.statSync(path.join(root,asset)).size,runtimeRefs:runtimeRefs.length,docsRefs:docsRefs.length,refs:refs.slice(0,6)}
})
const candidates=results.filter(x=>!x.runtimeRefs&&!x.docsRefs)
const suspicious=results.filter(x=>/reference|referencia|legacy|old|mockup|v1/i.test(x.file))
console.log('Activos versionados: '+results.length)
console.log('Referencias históricas/documentales: '+suspicious.length)
console.log('Sin referencia literal detectable (requiere auditoría manual): '+candidates.length)
console.log('Ejemplos de candidatos (NO autorizados para borrado):')
for(const item of candidates.slice(0,15)) console.log('  '+item.file)
console.log('Evidencia histórica en uso:')
for(const item of suspicious.slice(0,15)) console.log('  '+item.file+'; consumidores: '+item.refs.join(', '))
console.log('Aviso: las rutas construidas dinámicamente no se identifican por nombre literal.')
