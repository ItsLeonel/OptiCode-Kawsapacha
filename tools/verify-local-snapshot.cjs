'use strict'
/**
 * Auditoría NO destructiva de una copia local de SQLite y /uploads.
 * Node.js >= 24 (Node 22: módulo node:sqlite experimental).
 * No abre sesiones, no imprime nombres/correos/tokens y nunca escribe en SQLite.
 */
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { DatabaseSync } = require('node:sqlite')
const args = process.argv.slice(2)
const flag = name => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}
const dbArg = flag('--db'), uploadsArg = flag('--uploads')
if (!dbArg || !uploadsArg) {
  console.error('Uso: node tools/verify-local-snapshot.cjs --db RUTA_COPIA.sqlite --uploads CARPETA_COPIA_UPLOADS [--hash-photos]')
  process.exit(2)
}
const dbPath = path.resolve(dbArg), uploads = path.resolve(uploadsArg)
if (!fs.existsSync(dbPath) || !fs.statSync(dbPath).isFile()) {
  console.error('No existe el archivo SQLite de la copia.')
  process.exit(2)
}
if (!fs.existsSync(uploads) || !fs.statSync(uploads).isDirectory()) {
  console.error('No existe la carpeta de fotografías de la copia.')
  process.exit(2)
}
const problems = [], missing = [], warnings = []
const database = new DatabaseSync(dbPath, { readOnly: true })
try {
  database.exec('PRAGMA query_only=ON')
  const tables = new Set(database.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row => row.name))
  const names = [
    'users', 'communities', 'community_members', 'community_invitations', 'real_gardens',
    'medicinal_catalog', 'cultivated_plants', 'care_logs', 'harvest_records',
    'community_resources', 'garden_activities', 'activity_evidences', 'reward_ledgers',
    'user_badges', 'user_mission_progress', 'notifications', 'audit_logs',
    'reward_rules', 'mission_definitions', 'msp_institutional_events', 'msp_educational_resources',
  ]
  for (const name of names) if (!tables.has(name)) problems.push('Falta tabla: ' + name)
  const check = database.prepare('PRAGMA quick_check').all()
  if (check.length !== 1 || check[0].quick_check !== 'ok') problems.push('SQLite quick_check no devolvió ok')
  const foreignKeys = database.prepare('PRAGMA foreign_key_check').all()
  if (foreignKeys.length) problems.push('Hay ' + foreignKeys.length + ' violaciones de claves foráneas')
  function count(table, clause='') {
    if (!tables.has(table)) return null
    return database.prepare('SELECT COUNT(*) AS total FROM "' + table + '" ' + clause).get().total
  }
  function groups(table, field) {
    if (!tables.has(table)) return {}
    const rows = database.prepare('SELECT "' + field + '" AS label, COUNT(*) AS total FROM "' + table + '" GROUP BY "' + field + '"').all()
    return Object.fromEntries(rows.map(row => [String(row.label ?? 'sin especificar'), row.total]))
  }
  const rows = Object.fromEntries(names.map(name => [name, count(name)]))
  const roles = groups('users','role')
  const kinds = groups('real_gardens','kind')
  const provinces = groups('real_gardens','provinceCode')
  const regionForProvince = code => {
    if (['07','08','09','12','13','23','24'].includes(code)) return 'Costa'
    if (['01','02','03','04','05','06','10','11','17','18'].includes(code)) return 'Sierra'
    if (['14','15','16','19','21','22'].includes(code)) return 'Amazonía'
    return code === '20' ? 'Galápagos' : 'Desconocida'
  }
  const regions = {}
  for (const [province,n] of Object.entries(provinces)) {
    const region=regionForProvince(province)
    regions[region]=(regions[region] ?? 0)+n
  }
  let badPlots=0, photoRefs=0, checkedPhotos=0, externalUrls=0
  let hash=crypto.createHash('sha256')
  if (tables.has('cultivated_plants')) {
    badPlots=count('cultivated_plants','WHERE "plotIndex" IS NOT NULL AND ("plotIndex" < 0 OR "plotIndex" > 5)')
    if (badPlots) problems.push('Hay '+badPlots+' plantas asignadas fuera de las seis parcelas')
  }
  const hasher = args.includes('--hash-photos')
  for (const [table,col] of [
    ['communities','photoUrl'],['real_gardens','photoUrl'],
    ['cultivated_plants','photoUrl'],['activity_evidences','fileUrl'],
  ]) {
    if (!tables.has(table)) continue
    const list=database.prepare('SELECT "'+col+'" AS url FROM "'+table+'" WHERE "'+col+'" IS NOT NULL AND "'+col+'" <> \'\'' ).all()
    for (const row of list) {
      const url=String(row.url)
      photoRefs++
      let pathname=url
      if (/^https?:\/\//i.test(url)) {
        try {pathname=new URL(url).pathname} catch {externalUrls++;continue}
      }
      if (!pathname.startsWith('/uploads/')) { externalUrls++;continue }
      let rel
      try {rel=decodeURIComponent(pathname.slice('/uploads/'.length))} catch {missing.push('url no decodificable');continue}
      const target=path.resolve(uploads,rel)
      if (!target.startsWith(uploads+path.sep)) {problems.push('Referencia de fotografía fuera de uploads');continue}
      if (!fs.existsSync(target) || !fs.statSync(target).isFile() || !fs.statSync(target).size) {
        missing.push('referencia local sin archivo')
        continue
      }
      checkedPhotos++
      if (hasher) {
        hash.update(rel+'\0')
        hash.update(crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')+'\n')
      }
    }
  }
  if (missing.length) problems.push('Faltan '+missing.length+' fotografías referenciadas en /uploads')
  if (!rows.users) warnings.push('No hay usuarios: no se pueden probar roles ni login')
  if (!rows.real_gardens) warnings.push('No hay huertos para comprobar regiones ni modalidades')
  if (!rows.activity_evidences) warnings.push('No hay evidencias históricas para validar fotos de bitácora')
  const result = {
    readOnly:true, sqliteIntegrity:problems.length?'revisar':'ok',
    foreignKeyViolations:foreignKeys.length, tablesPresent:names.length-names.filter(n=>!tables.has(n)).length,
    tableCounts:rows, userRoles:roles, gardenKinds:kinds, gardenRegions:regions,
    invalidPlotIndices:badPlots,
    photos:{references:photoRefs,filesVerified:checkedPhotos,externalOrLegacyUrls:externalUrls,missing:missing.length},
    ...(hasher?{photoContentFingerprint:hash.digest('hex')}:{}),
    warnings,problems,
    manualFlowsNotExercised:['login/logout','permisos por rol','interfaz MSP/técnica','invitaciones','jardín Phaser','bitácora visual','recompensas/ledger en UI','notificaciones en UI'],
  }
  console.log(JSON.stringify(result,null,2))
  if (problems.length) process.exitCode=1
} finally {database.close()}
