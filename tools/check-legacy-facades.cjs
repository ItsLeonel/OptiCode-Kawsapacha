'use strict'
const fs=require('node:fs'),path=require('node:path')
const project=path.resolve(__dirname,'../frontend')
const sources=[path.join(project,'src'),path.join(project,'tests')]
const facades=[
 'src/App.tsx','src/EcuadorMap.tsx','src/utils/reviewStatus.ts','src/services/api.ts',
]
const target=new Map(facades.map(p=>[path.resolve(project,p).replace(/\.(?:tsx?|jsx?)$/,''),[]]))
const all=[]
function visit(folder){
 if(!fs.existsSync(folder))return
 for(const ent of fs.readdirSync(folder,{withFileTypes:true})){
  const full=path.join(folder,ent.name)
  if(ent.isDirectory()){if(!['node_modules','dist','test-results'].includes(ent.name))visit(full)}
  else if(ent.isFile()&&/\.(?:tsx?|jsx?|mjs|cjs)$/.test(ent.name))all.push(full)
 }
}
sources.forEach(visit)
for(const file of fs.readdirSync(project).filter(n=>/^(?:vite|playwright|vitest).*\.(?:ts|js|mjs|cjs)$/.test(n))) all.push(path.join(project,file))
for(const file of all){
 const source=fs.readFileSync(file,'utf8')
 const specs=[...source.matchAll(/(?:\bfrom\s*|\brequire\s*\(|\bimport\s*\(|\bimport\s*['"])(?:\s*['"])?([^'"]+)['"]/g)].map(m=>m[1])
 for(const spec of specs){
  if(!spec.startsWith('.'))continue
  const pathWithoutExt=path.resolve(path.dirname(file),spec).replace(/\.(?:tsx?|jsx?)$/,'')
  if(target.has(pathWithoutExt))target.get(pathWithoutExt).push(path.relative(project,file))
 }
}
const obsolete=[]
for(const [f,importers] of target){
 const relative=path.relative(project,f)
 const unique=[...new Set(importers)].sort()
 if(!unique.length)obsolete.push(relative)
 console.log(relative+': '+unique.length+' consumidores estáticos'+(unique.length?' ('+unique.slice(0,8).join(', ')+')':' [candidato a revisión manual]'))
}
console.log('Archivos inspeccionados: '+all.length)
if(obsolete.length){console.error('Fachadas sin consumidores que deben depurarse: '+obsolete.join(', '));process.exitCode=1}
