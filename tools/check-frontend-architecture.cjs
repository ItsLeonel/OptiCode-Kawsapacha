'use strict'
/** Límite de dependencias: shared no puede depender de features ni de app. */
const fs=require('node:fs'),path=require('node:path')
const root=path.resolve(__dirname,'../frontend/src')
const shared=path.join(root,'shared')
const errors=[]
let count=0
function walk(folder){
 for(const ent of fs.readdirSync(folder,{withFileTypes:true})){
  const full=path.join(folder,ent.name)
  if(ent.isDirectory())walk(full)
  else if(ent.isFile()&&/\.tsx?$/.test(ent.name))check(full)
 }
}
function check(file){
 count++
 const text=fs.readFileSync(file,'utf8')
 for(const match of text.matchAll(/(?:\bfrom\s*|\brequire\s*\(|\bimport\s*\()\s*['"]([^'"]+)['"]/g)){
  const spec=match[1]
  if(!spec||!spec.startsWith('.'))continue
  const absolute=path.resolve(path.dirname(file),spec)
  if(absolute.startsWith(path.join(root,'features')+path.sep)||absolute.startsWith(path.join(root,'app')+path.sep)){
   errors.push(path.relative(root,file)+': importar '+spec+' invierte la dependencia de shared')
  }
 }
}
walk(shared)
console.log('Archivos compartidos inspeccionados: '+count)
if(errors.length){
 console.error('Violaciones de arquitectura frontend:\n'+errors.join('\n'))
 process.exitCode=1
}else console.log('OK: shared no importa features ni app.')
