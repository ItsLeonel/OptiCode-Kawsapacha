'use strict'
/** Límite de dependencias: shared no puede depender de features ni de app. */
const fs=require('node:fs'),path=require('node:path')
const root=path.resolve(__dirname,'../frontend/src')
const shared=path.join(root,'shared')
const errors=[]
let count=0
function walk(folder, checker = check){
 for(const ent of fs.readdirSync(folder,{withFileTypes:true})){
  const full=path.join(folder,ent.name)
  if(ent.isDirectory())walk(full,checker)
  else if(ent.isFile()&&/\.tsx?$/.test(ent.name))checker(full)
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
/** Phaser recibe modelos visuales del puente React, sin llamadas al backend. */
let phaserCount = 0
function checkPhaser(file){
  phaserCount++
  const source=fs.readFileSync(file,'utf8')
  for(const match of source.matchAll(/(?:from\s*|require\s*\(|import\s*\()\s*['"]([^'"]+)['"]/g)){
    const spec=match[1]
    if (!spec.startsWith('.')) continue
    const target=path.resolve(path.dirname(file),spec)
    if(target.startsWith(path.join(root,'shared','api')+path.sep)||
       target.startsWith(path.join(root,'services')+path.sep)){
      errors.push(path.relative(root,file)+': Phaser no puede depender del cliente HTTP: '+spec)
    }
  }
}
/** Las funcionalidades no deben depender del ensamblaje raíz app. */
let featureCount=0
function checkFeature(file){
 featureCount++
 const source=fs.readFileSync(file,'utf8')
 for(const match of source.matchAll(/(?:\\bfrom\\s*|\\brequire\\s*\\(|\\bimport\\s*\\()\\s*['"]([^'"]+)['"]/g)){
   const spec=match[1]
   if(!spec.startsWith('.'))continue
   const target=path.resolve(path.dirname(file),spec)
   if(target.startsWith(path.join(root,'app')+path.sep)){
     errors.push(path.relative(root,file)+': features no puede importar app: '+spec)
   }
 }
}
walk(shared)
walk(path.join(root,'features'),checkFeature)
console.log('Archivos de features inspeccionados: '+featureCount)
walk(path.join(root,'features','my-garden','phaser-poc'),checkPhaser)
console.log('Archivos Phaser inspeccionados: '+phaserCount)
console.log('Archivos compartidos inspeccionados: '+count)
if(errors.length){
 console.error('Violaciones de arquitectura frontend:\n'+errors.join('\n'))
 process.exitCode=1
}else console.log('OK: shared no importa features ni app.')
