// Ejecución de casos de integración contra la API real (base SQLite temporal).
// Registra cada paso con lo esperado y lo obtenido; no corrige resultados.
import fs from 'node:fs'

const API = 'http://localhost:3000/api'
const PHOTO = process.argv[2]
const OUT = process.argv[3]
const stamp = Date.now()
const log = []
let current = null

function startCase(id, title, hu) { current = { id, title, hu, steps: [] }; log.push(current) }
function step(desc, expected, obtained, ok) { current.steps.push({ desc, expected, obtained, ok }); console.log(`${ok ? 'OK ' : 'XX '} ${current.id} · ${desc} → ${obtained}`) }

async function call(method, path, { token, json, form } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let body
  if (json) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(json) }
  if (form) body = form
  const res = await fetch(API + path, { method, headers, body })
  let data = null
  try { data = await res.json() } catch { data = null }
  return { status: res.status, body: data }
}
const code = (r) => r.body?.code ?? r.body?.error?.code ?? r.body?.errorCode ?? ''
const short = (r) => `HTTP ${r.status}${code(r) ? ' ' + code(r) : ''}${r.body?.message ? ' «' + r.body.message + '»' : ''}`

async function register(name, email) {
  const r = await call('POST', '/auth/register', { json: { name, email, password: 'Prueba2026' } })
  return { r, token: r.body?.data?.token, user: r.body?.data?.user }
}
async function login(email, password) {
  const r = await call('POST', '/auth/login', { json: { email, password } })
  return { r, token: r.body?.data?.token, user: r.body?.data?.user }
}

const photoBlob = () => new Blob([fs.readFileSync(PHOTO)], { type: 'image/jpeg' })

try {
  // ---------- preparación común ----------
  const a = await register('Ana QA', `qa.ana.${stamp}@example.com`)
  const b = await register('Bruno QA', `qa.bruno.${stamp}@example.com`)
  if (!a.token || !b.token) throw new Error('No se pudieron crear las cuentas: ' + short(a.r) + ' / ' + short(b.r))

  const cform = new FormData()
  for (const [k, v] of Object.entries({ name: 'Comunidad QA ' + stamp, responsible: 'Ana QA', location: 'Imbabura', description: 'Comunidad ficticia de pruebas', type: 'barrial', province: 'Imbabura' })) cform.append(k, v)
  const com = await call('POST', '/communities', { token: a.token, form: cform })
  const communityId = com.body?.data?.community?.id ?? com.body?.data?.id
  if (!communityId) throw new Error('No se pudo crear la comunidad: ' + short(com))

  // ---------- P-018 Invitaciones ----------
  startCase('P-018', 'Invitar a un integrante y responder la invitación', 'HU-007, HU-020')
  let r = await call('POST', `/communities/${communityId}/members/invite`, { token: a.token, json: { email: `no.existe.${stamp}@example.com`, role: 'PARTICIPANTE' } })
  step('Invitar un correo no registrado', 'Rechazo sin crear invitación', short(r), r.status >= 400 && r.status < 500)
  r = await call('POST', `/communities/${communityId}/members/invite`, { token: b.token, json: { email: a.user.email, role: 'PARTICIPANTE' } })
  step('Una persona ajena intenta invitar', 'Rechazo por permisos (403)', short(r), r.status === 403)
  r = await call('POST', `/communities/${communityId}/members/invite`, { token: a.token, json: { email: b.user.email, role: 'PARTICIPANTE' } })
  step('La Responsable invita a Bruno como Participante', 'Invitación creada', short(r), r.status === 200 || r.status === 201)
  r = await call('GET', '/users/me/invitations', { token: b.token })
  const invitations = r.body?.data?.invitations ?? r.body?.data ?? []
  const inv = (Array.isArray(invitations) ? invitations : []).find((i) => (i.communityId ?? i.community?.id) === communityId)
  step('Bruno consulta sus invitaciones', 'La invitación aparece pendiente', `${short(r)}; ${inv ? 'invitación ' + inv.status : 'no aparece'}`, !!inv && inv.status === 'PENDING')
  r = await call('POST', `/invitations/${inv?.id}/accept`, { token: b.token })
  step('Bruno acepta la invitación', 'Pasa a ser integrante', short(r), r.status === 200)
  r = await call('POST', `/invitations/${inv?.id}/accept`, { token: b.token })
  step('Bruno intenta aceptarla otra vez', 'Se informa que ya fue procesada', short(r), r.status >= 400 && /ALREADY_PROCESSED|procesada/i.test(JSON.stringify(r.body)))
  r = await call('GET', `/communities/${communityId}/members`, { token: a.token })
  const members = r.body?.data?.members ?? r.body?.data ?? []
  const bm = (Array.isArray(members) ? members : []).find((m) => (m.userId ?? m.user?.id) === b.user.id)
  step('La lista de integrantes incluye a Bruno', 'Bruno figura como Participante', `${short(r)}; ${bm ? bm.roleInCommunity : 'no figura'}`, bm?.roleInCommunity === 'PARTICIPANTE')

  // ---------- P-019 Bodega ----------
  startCase('P-019', 'Gestionar el almacén comunitario con control de permisos', 'HU-021')
  r = await call('POST', `/communities/${communityId}/resources`, { token: a.token, json: { name: 'Pala', category: 'TOOL', quantity: 2, unit: 'unidades' } })
  const resource = r.body?.data?.resource ?? r.body?.data
  step('La Responsable registra una herramienta', 'Recurso creado en el inventario', short(r), (r.status === 200 || r.status === 201) && !!resource?.id)
  r = await call('POST', `/communities/${communityId}/resources`, { token: b.token, json: { name: 'Semillas', category: 'SEED', quantity: 1, unit: 'sobres' } })
  step('Un Participante intenta registrar un recurso', 'Rechazo por permisos (403)', short(r), r.status === 403)
  r = await call('PATCH', `/communities/${communityId}/resources/${resource?.id}`, { token: a.token, json: { status: 'MANTENIMIENTO', quantity: 1 } })
  const upd = r.body?.data?.resource ?? r.body?.data
  step('La Responsable cambia estado y cantidad', 'Inventario refleja MANTENIMIENTO y 1', `${short(r)}; ${upd?.status} / ${upd?.quantity}`, upd?.status === 'MANTENIMIENTO' && upd?.quantity === 1)
  r = await call('DELETE', `/communities/${communityId}/resources/${resource?.id}`, { token: b.token })
  step('Un Participante intenta eliminar el recurso', 'Rechazo por permisos (403)', short(r), r.status === 403)
  r = await call('DELETE', `/communities/${communityId}/resources/${resource?.id}`, { token: a.token })
  const list = await call('GET', `/communities/${communityId}/resources`, { token: a.token })
  const remaining = JSON.stringify(list.body?.data ?? '').includes(resource?.id ?? 'x')
  step('La Responsable elimina el recurso', 'Deja de mostrarse en el inventario', `${short(r)}; ${remaining ? 'sigue en la lista' : 'ya no está en la lista'}`, r.status === 200 && !remaining)

  // ---------- P-020 Actividad, puntos y cosecha ----------
  startCase('P-020', 'Registrar riego con puntos y cosechar con rebrote', 'HU-015, HU-017, HU-018, HU-022')
  const gform = { name: 'Huerto QA', kind: 'ground', areaM2: 20, province: 'Imbabura', provinceCode: '10', communityId, irrigationAvailability: 'unknown', soilType: 'heavyClay' }
  r = await call('POST', '/gardens', { token: a.token, json: gform })
  const garden = r.body?.data?.garden ?? r.body?.data
  step('Registrar el huerto en tierra con suelo gredoso', 'Huerto creado con suelo gredoso', `${short(r)}; suelo ${garden?.soilType}`, !!garden?.id && garden?.soilType === 'heavyClay')
  const cat = await call('GET', '/catalog?q=Manzanilla')
  const species = (cat.body?.data?.species ?? cat.body?.data ?? []).find?.((s) => s.name === 'Manzanilla')
  const pform = new FormData(); pform.append('speciesId', species?.id ?? ''); pform.append('plotIndex', '0'); pform.append('picture', photoBlob(), 'manzanilla.jpg')
  r = await call('POST', `/gardens/${garden?.id}/plants`, { token: a.token, form: pform })
  const plant = r.body?.data?.plant
  step('Registrar una manzanilla con foto en el espacio 1, con la comunidad aún sin revisión MSP', 'Planta guardada de inmediato', `${short(r)}; comunidad ${com.body?.data?.community?.status ?? com.body?.data?.status ?? '?'}`, !!plant?.id)
  const before = await call('GET', '/users/me/rewards', { token: a.token })
  const pts0 = before.body?.data?.totalPoints ?? before.body?.data?.points ?? before.body?.data?.balance
  const wform = new FormData(); for (const [k, v] of Object.entries({ type: 'watering', targetKind: 'plant', plantId: plant?.id, plotIndex: '0', notes: 'Riego de prueba', clientActivityId: 'qa-riego-' + stamp })) wform.append(k, v)
  r = await call('POST', `/gardens/${garden?.id}/activities`, { token: a.token, form: wform })
  const activity = r.body?.data?.activity ?? r.body?.data
  step('Registrar un riego de la planta', 'Actividad guardada y válida (APPROVED)', `${short(r)}; estado ${activity?.reviewStatus}`, !!activity?.id && activity?.reviewStatus === 'APPROVED')
  const after = await call('GET', '/users/me/rewards', { token: a.token })
  const pts1 = after.body?.data?.totalPoints ?? after.body?.data?.points ?? after.body?.data?.balance
  step('Consultar Mi Camino Verde', 'El riego suma 5 puntos', `antes ${pts0}, después ${pts1}`, typeof pts1 === 'number' && pts1 - (pts0 ?? 0) === 5)
  const w2 = new FormData(); for (const [k, v] of Object.entries({ type: 'watering', targetKind: 'plant', plantId: plant?.id, plotIndex: '0', clientActivityId: 'qa-riego-' + stamp })) w2.append(k, v)
  r = await call('POST', `/gardens/${garden?.id}/activities`, { token: a.token, form: w2 })
  const again = await call('GET', '/users/me/rewards', { token: a.token })
  const pts2 = again.body?.data?.totalPoints ?? again.body?.data?.points ?? again.body?.data?.balance
  step('Reenviar el mismo riego (mismo identificador de reintento)', 'No se duplica la actividad ni los puntos', `${short(r)}; puntos ${pts2}`, pts2 === pts1)
  r = await call('POST', `/plants/${plant?.id}/harvest`, { token: a.token, json: { quantity: '200 g', notes: 'Cosecha de hojas' } })
  step('Cosechar la manzanilla', 'Cosecha registrada', short(r), r.status === 200 || r.status === 201)
  const pp = await call('GET', `/plants/${plant?.id}/passport`, { token: a.token })
  const life = pp.body?.data?.passport?.lifecycleStatus
  const plot = pp.body?.data?.passport?.plotIndex
  step('Consultar la planta tras la cosecha', 'Sigue en su espacio (rebrote)', `estado ${life}, espacio ${plot}`, plot === 0 && ['REGROWING', 'HARVESTED'].includes(life))
  const inv2 = await call('GET', `/communities/${communityId}/resources`, { token: a.token })
  const harvestRes = JSON.stringify(inv2.body?.data ?? '').includes('Cosecha: Manzanilla')
  step('Revisar el almacén', 'Aparece «Cosecha: Manzanilla»', harvestRes ? 'aparece' : 'no aparece', harvestRes)

  // ---------- P-021 Revisión MSP y notificaciones ----------
  startCase('P-021', 'Revisión MSP posterior, reversión de puntos y notificación', 'HU-028, HU-029, HU-031')
  const admin = await login('admin1@mail.com', 'Password123')
  step('Iniciar sesión como administrador técnico', 'Sesión con rol ADMIN_TECNICO', `${short(admin.r)}; rol ${admin.user?.role}`, admin.user?.role === 'ADMIN_TECNICO')
  const mspEmail = `qa.msp.${stamp}@example.com`
  r = await call('POST', '/admin/technical/msp-users', { token: admin.token, json: { name: 'Funcionaria MSP QA', email: mspEmail, password: 'Prueba2026' } })
  step('Crear una cuenta de funcionario MSP', 'Cuenta creada', short(r), r.status === 200 || r.status === 201)
  r = await call('POST', '/admin/technical/msp-users', { token: admin.token, json: { name: 'Repetida', email: mspEmail, password: 'Prueba2026' } })
  step('Crear otra cuenta con el mismo correo', 'Se rechaza (409)', short(r), r.status === 409)
  r = await call('GET', '/admin/msp/activities', { token: a.token })
  step('Una usuaria común intenta abrir el panel MSP', 'Rechazo por permisos (403)', short(r), r.status === 403)
  const msp = await login(mspEmail, 'Prueba2026')
  r = await call('GET', '/admin/msp/activities', { token: msp.token })
  const found = JSON.stringify(r.body?.data ?? '').includes(activity?.id ?? 'x')
  step('La funcionaria MSP lista las actividades', 'Aparece el riego registrado', `${short(r)}; ${found ? 'aparece' : 'no aparece'}`, found)
  r = await call('POST', `/admin/msp/activities/${activity?.id}/review`, { token: msp.token, json: { action: 'REJECTED', reason: 'Prueba QA: evidencia insuficiente' } })
  step('Invalidar el riego con un motivo', 'Actividad invalidada', short(r), r.status === 200)
  const after2 = await call('GET', '/users/me/rewards', { token: a.token })
  const pts3 = after2.body?.data?.totalPoints ?? after2.body?.data?.points ?? after2.body?.data?.balance
  step('Consultar los puntos de Ana', 'Se descuentan los 5 puntos una sola vez', `antes ${pts1}, después ${pts3}`, typeof pts3 === 'number' && pts1 - pts3 === 5)
  r = await call('POST', `/admin/msp/activities/${activity?.id}/review`, { token: msp.token, json: { action: 'REJECTED', reason: 'Repetición' } })
  const after3 = await call('GET', '/users/me/rewards', { token: a.token })
  const pts4 = after3.body?.data?.totalPoints ?? after3.body?.data?.points ?? after3.body?.data?.balance
  step('Repetir la invalidación', 'No se descuenta dos veces', `${short(r)}; puntos ${pts4}`, pts4 === pts3)
  r = await call('GET', '/notifications', { token: a.token })
  const notif = JSON.stringify(r.body?.data ?? '')
  step('Ana abre sus notificaciones', 'Aviso de actividad invalidada con el motivo', `${short(r)}; ${/ACTIVITY_REJECTED/.test(notif) ? 'aviso presente' : 'sin aviso'}${/evidencia insuficiente/.test(notif) ? ', con motivo' : ''}`, /ACTIVITY_REJECTED/.test(notif))
  r = await call('PATCH', '/notifications/read-all', { token: a.token })
  const n2 = await call('GET', '/notifications', { token: a.token })
  const unread = JSON.stringify(n2.body?.data ?? '').includes('"isRead":false')
  step('Marcar todas como leídas', 'No quedan avisos sin leer', `${short(r)}; ${unread ? 'quedan sin leer' : 'todas leídas'}`, r.status === 200 && !unread)
  r = await call('GET', '/admin/technical/audit-logs', { token: admin.token })
  const audited = JSON.stringify(r.body?.data ?? '').includes(activity?.id ?? 'x')
  step('Consultar la auditoría como administrador técnico', 'La invalidación figura en la auditoría', `${short(r)}; ${audited ? 'figura' : 'no figura'}`, audited)
} catch (e) {
  if (current) step('Error inesperado del script', '—', String(e.message || e), false)
  else log.push({ id: 'SETUP', title: 'Preparación', hu: '', steps: [{ desc: 'Preparación', expected: '—', obtained: String(e.message || e), ok: false }] })
}
fs.writeFileSync(OUT, JSON.stringify({ executedAt: new Date().toISOString(), cases: log }, null, 2))
for (const c of log) console.log(`${c.id}: ${c.steps.every((s) => s.ok) ? 'APROBADO' : 'REPROBADO'} (${c.steps.filter((s) => s.ok).length}/${c.steps.length})`)
