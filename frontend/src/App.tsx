import { useEffect, useMemo, useRef, useState } from 'react'
import AuthPage from './features/auth/AuthPage'
import type { AuthSubmitHandler } from './features/auth/auth'
import MyGardenPage from './features/my-garden/MyGardenPage'
import GardenNavigation from './features/my-garden/GardenNavigation'
import GardenHistory from './features/my-garden/GardenHistory'
import PlantPassport from './features/my-garden/PlantPassport'
import PlantEditor from './features/my-garden/PlantEditor'
import GardenPlants from './features/my-garden/GardenPlants'
import PlantRegistrationModal, { type PlantRegistrationDraft } from './features/my-garden/PlantRegistrationModal'
import { PLANT_SPECIES as SPECIES, type PlantRegistration, type PlantRegistrationResult } from './features/my-garden/plant-species'
import CommunitiesPage, { type CommunityEntryAction } from './features/communities/CommunitiesPage'
import type { Community } from './features/communities/communities'
import RealGardenPage from './features/real-gardens/RealGardenPage'
import { toGardenDraft, type RealGarden, type RealGardenDraft } from './features/real-gardens/real-garden'
import { PLOT_COUNT, type GardenAction, type GardenDestination, type GardenPlant } from './features/my-garden/garden'
import { matchesCommunityLocation, withCommunityLocation } from './features/real-gardens/garden-community-location'
import type { GardenSceneRenderer } from './features/my-garden/garden-scene-renderer'
import { localDate, recordId, validatePlantUpdate, validDate, type PlantUpdate } from './features/my-garden/plant-record'
import { useGardenJournal } from './features/my-garden/journal/useGardenJournal'
import ActivityModal from './features/my-garden/journal/ActivityModal'
import ActivityList from './features/my-garden/journal/ActivityList'
import { activityKey, type ActivityDraft, type ActivityType, type GardenActivity } from './features/my-garden/journal/activities'
import './features/my-garden/garden-journal.css'
import GardenProgress from './features/my-garden/GardenProgress'
import GreenChallenges from './features/my-garden/GreenChallenges'
import { calculateProgress } from './features/my-garden/journal/progress'

type Screen = 'Bienvenida' | 'Inicio' | 'Usuarios' | 'Comunidades' | 'Mi terreno' | 'Plantas medicinales' | 'Mis plantas' | 'Bitácora' | 'Mi historia' | 'Mi camino verde'
const SCREEN_PATHS: Record<Screen, string> = {
  Bienvenida: '#bienvenida', Inicio: '#mi-jardin', Usuarios: '#usuarios', Comunidades: '#comunidades',
  'Mi terreno': '#mi-jardin/terreno', 'Plantas medicinales': '#plantas', 'Mis plantas': '#mis-plantas', 'Bitácora': '#bitacora', 'Mi historia': '#mi-historia', 'Mi camino verde': '#progreso',
}
function currentScreen(): Screen {
  if (window.location.hash === '#huerto-real') return 'Mi terreno'
  return (Object.keys(SCREEN_PATHS) as Screen[]).find(key => SCREEN_PATHS[key] === window.location.hash) ?? 'Bienvenida'
}
const draftKey = (draft: RealGardenDraft) => JSON.stringify({ ...draft, photo: draft.photo ? [draft.photo.name, draft.photo.size, draft.photo.lastModified] : null })

export default function App({ onAuthenticate, renderGardenScene }: { onAuthenticate?: AuthSubmitHandler; renderGardenScene?: GardenSceneRenderer } = {}) {
  const journal = useGardenJournal()
  const { data, plants } = journal
  const communityRecord = data.community, realGarden = data.terrain
  const [screen, setScreen] = useState<Screen>(currentScreen)
  const [authenticated, setAuthenticated] = useState(false)
  const [communityEntry, setCommunityEntry] = useState<CommunityEntryAction | null>(null)
  const [realGardenDraft, setRealGardenDraft] = useState<RealGardenDraft>(() => toGardenDraft(null))
  const previousTerrain = useRef<RealGarden | null>(null), initializedDraft = useRef(false)
  const [registration, setRegistration] = useState<PlantRegistrationDraft | null>(null)
  const [pendingRegistration, setPendingRegistration] = useState<PlantRegistrationDraft | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null), [editingId, setEditingId] = useState<string | null>(null)
  const [activityForm, setActivityForm] = useState<{ plantId?: string; plot?: number | null } | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; type: ActivityType; plot: number | null } | null>(null)
  const [query, setQuery] = useState(''), [notice, setNotice] = useState('')
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null)
  const detail = plants.find(plant => plant.id === detailId) ?? null, editingPlant = plants.find(plant => plant.id === editingId)
  const activePlants = plants.filter(plant => !plant.archivedAt)
  const progress = useMemo(() => calculateProgress(data, communityRecord?.responsible), [data, communityRecord?.responsible])

  useEffect(() => {
    if (!journal.ready) return
    const previous = previousTerrain.current
    setRealGardenDraft(current => {
      if (!initializedDraft.current || draftKey(current) === draftKey(toGardenDraft(previous))) return realGarden ? toGardenDraft(realGarden) : communityRecord ? withCommunityLocation(current, communityRecord) : current
      return current
    })
    initializedDraft.current = true; previousTerrain.current = realGarden
  }, [journal.ready, realGarden, communityRecord])
  useEffect(() => {
    if (screen === 'Bienvenida' || screen === 'Usuarios') return
    document.querySelector<HTMLElement>('[data-screen-heading]')?.focus({ preventScroll: true }); window.scrollTo(0, 0)
  }, [screen])
  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, '', SCREEN_PATHS.Bienvenida)
    const restore = () => { setRegistration(null); setDetailId(null); setEditingId(null); setActivityForm(null); setFeedback(null); setCommunityEntry(null); setScreen(currentScreen()) }
    window.addEventListener('popstate', restore); window.addEventListener('hashchange', restore)
    return () => { window.removeEventListener('popstate', restore); window.removeEventListener('hashchange', restore) }
  }, [])
  useEffect(() => { if (!feedback) return; const timeout = setTimeout(() => setFeedback(null), 2200); return () => clearTimeout(timeout) }, [feedback])

  function goto(next: Screen) {
    if (window.location.hash !== SCREEN_PATHS[next]) window.history.pushState(null, '', SCREEN_PATHS[next])
    setRegistration(null); setDetailId(null); setEditingId(null); setActivityForm(null); setFeedback(null); setCommunityEntry(null); setScreen(next)
  }
  function openCommunity(action: CommunityEntryAction) { goto('Comunidades'); setCommunityEntry(action) }
  function connectGarden() { goto('Inicio'); if (pendingRegistration) { setRegistration(pendingRegistration); setPendingRegistration(null) } }
  async function saveCommunity(next: Community) {
    const saved = await journal.commit({ id: recordId('community-save'), type: 'community', community: next })
    if (!saved.terrain) setRealGardenDraft(current => {
      if (matchesCommunityLocation(current, next) || (current.province && !matchesCommunityLocation(current, communityRecord))) return current
      return { ...withCommunityLocation(current, next), reference: current.reference && current.reference !== communityRecord?.sector ? current.reference : next.sector ?? '' }
    })
    setNotice('Comunidad guardada en este navegador.'); if (communityEntry === 'create') goto('Inicio')
  }
  async function saveGarden(next: RealGarden) {
    const saved = await journal.commit({ id: recordId('terrain-save'), type: 'terrain', terrain: next })
    setRealGardenDraft(toGardenDraft(saved.terrain)); setNotice('Terreno guardado en este navegador.')
  }
  async function addPlant(input: PlantRegistration): Promise<PlantRegistrationResult> {
    if (!communityRecord || !realGarden) return { ok: false, error: 'Primero registra tu comunidad y tu terreno.' }
    if (!Number.isInteger(input.plot) || input.plot < 0 || input.plot >= PLOT_COUNT || activePlants.some(plant => plant.plot === input.plot)) return { ok: false, error: 'Selecciona un espacio disponible. No se sustituirá ninguna planta.' }
    if (input.plantedOn && !validDate(input.plantedOn)) return { ok: false, error: 'Indica una fecha de siembra válida, hasta hoy.' }
    if (input.recordSowing && (!input.plantedOn || !input.responsible?.trim())) return { ok: false, error: 'Indica la fecha de siembra y su responsable.' }
    const id = input.requestId ? 'plant-' + input.requestId : recordId('plant'), photoId = recordId('photo'), now = new Date().toISOString()
    const plant: GardenPlant = { id, name: input.species.name, latin: input.species.latin, photo: '', photoId, date: new Date().toLocaleDateString('es-EC'), plot: input.plot,
      createdAt: now, state: 'not-documented', ...(input.plantedOn ? { plantedOn: input.plantedOn } : {}),
      evidences: [{ id: 'initial-' + id, date: localDate(), notes: 'Fotografía de registro', photoId }],
    }
    const sowing: GardenActivity | undefined = input.recordSowing ? { id: 'sowing-' + id, gardenId: data.gardenId, type: 'sowing', date: input.plantedOn!, responsible: input.responsible!.trim(), target: { kind: 'plant', plantId: id, plot: input.plot }, notes: 'Siembra documentada junto con la ficha y su fotografía.', photoIds: [photoId], details: {}, createdAt: now, validation: 'local-v1' } : undefined
    try {
      await journal.commit({ id: input.requestId ?? id, type: 'plant-add', plant, sowing }, [{ id: photoId, blob: input.photo }])
      goto('Inicio'); setDetailId(id); setSelectedPlot(null); setNotice('Planta y fotografía guardadas en este navegador.'); return { ok: true }
    } catch (cause) { return { ok: false, error: cause instanceof Error ? cause.message : 'No se pudo guardar la planta. Tu fotografía sigue disponible.' } }
  }
  function selectPlant(plant: GardenPlant) { setDetailId(plant.id) }
  function registerInPlot(plot?: number, species: string = SPECIES[0].name, message?: string) {
    setSelectedPlot(plot ?? null); setDetailId(null); setEditingId(null); setPendingRegistration(null)
    setRegistration({ plot: plot ?? null, species, notice: message, photo: null, plantedOn: '', responsible: communityRecord?.responsible ?? '' })
  }
  async function updatePlant(draft: PlantUpdate) {
    if (!editingPlant) throw new Error('No se encontró la ficha de la planta.')
    const invalid = validatePlantUpdate(draft, editingPlant, plants); if (invalid) throw new Error(invalid)
    const photoId = draft.photo ? recordId('photo') : undefined
    const { photo, ...fields } = draft
    await journal.commit({ id: draft.requestId ?? recordId('plant-update'), type: 'plant-update', plantId: editingPlant.id, draft: fields, evidenceId: 'evidence-' + (draft.requestId ?? recordId('update')), photoId, retainedPhotoId: editingPlant.photoId, at: new Date().toISOString() }, photo && photoId ? [{ id: photoId, blob: photo }] : [])
    setEditingId(null); setDetailId(editingPlant.id); setNotice('Observación y evidencias guardadas.')
  }
  async function archivePlant() { if (!detail) return; await journal.commit({ id: recordId('archive'), type: 'plant-archive', plantId: detail.id, at: new Date().toISOString() }); setDetailId(null); setNotice('Ficha archivada. Sus fotografías y actividades se conservan.') }
  async function restorePlant() {
    if (!detail) return null
    try { await journal.commit({ id: recordId('restore'), type: 'plant-restore', plantId: detail.id, at: new Date().toISOString() }); return null } catch (cause) { return cause instanceof Error ? cause.message : 'No se pudo restaurar la ficha.' }
  }
  function openActivity(plant?: GardenPlant) {
    if (!realGarden || !communityRecord) { goto('Mi terreno'); setNotice('Registra primero tu comunidad y tu terreno.'); return }
    setDetailId(null); setActivityForm({ plantId: plant?.id, plot: plant?.plot ?? selectedPlot })
  }
  async function saveActivity(draft: ActivityDraft) {
    const photoId = draft.photo ? recordId('photo') : undefined
    const activity: GardenActivity = { id: draft.id, gardenId: data.gardenId, type: draft.type, date: draft.date, responsible: draft.responsible, target: draft.target, notes: draft.notes, details: draft.details, createdAt: new Date().toISOString(), validation: 'local-v1', photoIds: photoId ? [photoId] : [] }
    const saved = await journal.commit({ id: draft.id, type: 'activity', activity }, draft.photo && photoId ? [{ id: photoId, blob: draft.photo }] : [])
    const actual = saved.activities.find(item => item.id === draft.id)
    setActivityForm(null)
    setNotice(actual ? 'Actividad guardada en este navegador.' : 'Esta actividad ya estaba guardada. Se conservó un único registro.')
    if (actual && screen === 'Inicio') setFeedback({ id: actual.id, type: actual.type, plot: actual.details.destinationPlot ?? (actual.target.kind === 'garden' ? null : actual.target.plot) })
    if (!actual && !saved.activities.some(item => activityKey(item) === activityKey(activity))) throw new Error('No se encontró la actividad guardada.')
  }
  async function voidActivity(id: string, reason: string) { await journal.commit({ id: recordId('activity-void'), type: 'activity-void', activityId: id, reason, at: new Date().toISOString() }); setNotice('Actividad anulada; la evidencia y el historial se conservan.') }
  function navigateGarden(destination: GardenDestination) {
    const destinations: Record<GardenDestination, Screen> = { garden: 'Inicio', community: 'Comunidades', 'real-garden': 'Mi terreno', plants: 'Plantas medicinales', 'my-plants': 'Mis plantas', history: 'Bitácora', progress: 'Mi camino verde' }
    goto(destinations[destination])
  }
  function gardenAction(action: GardenAction) {
    if (action === 'register') registerInPlot()
    else if (action === 'activity') openActivity()
    else if (action === 'real-garden') goto('Mi terreno')
    else if (action === 'logbook') goto('Bitácora')
    else if (action === 'my-plants') goto('Mis plantas')
    else if (action === 'progress') goto('Mi camino verde')
    else if (activePlants.length) setDetailId(activePlants[activePlants.length - 1].id)
    else registerInPlot(undefined, SPECIES[0].name, 'Tu Pasaporte Vivo comienza con una fotografía. Registra tu primera planta para consultarlo.')
  }
  const ready = Boolean(communityRecord && realGarden)
  const activeNavigation: 'garden' | 'community' | 'progress' = screen === 'Comunidades' ? 'community' : screen === 'Mi historia' || screen === 'Mi camino verde' ? 'progress' : 'garden'
  const visible = SPECIES.filter(species => `${species.name} ${species.latin}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  if (screen === 'Bienvenida' || screen === 'Usuarios') return <AuthPage onSubmit={onAuthenticate} onAuthenticated={() => { setAuthenticated(true); goto('Inicio') }} onExploreDemo={(destination = 'Inicio') => { setAuthenticated(false); goto(destination) }}/>
  if (journal.loading || (journal.ready && !initializedDraft.current)) return <main className="journal-loading" role="status">Recuperando tu jardín y sus fotografías…</main>
  if (!journal.ready) return <main className="journal-loading"><h1>No se pudo abrir el jardín guardado</h1><p role="alert">{journal.failure}</p><p>Los datos existentes no se han sobrescrito.</p><button type="button" onClick={journal.retry}>Volver a intentar</button><button type="button" onClick={() => goto('Bienvenida')}>Volver a bienvenida</button></main>
  return <div className="garden-shell">
    <GardenNavigation demo={!authenticated} active={activeNavigation} progress={{ points: progress.points, level: progress.level, progressPercent: progress.progressPercent, nextLevel: progress.nextLevel, badges: progress.badges }} onNavigate={navigateGarden} onWelcome={() => goto('Bienvenida')}/>
    {screen === 'Inicio' || screen === 'Mi terreno' ? <MyGardenPage demo={!authenticated} plants={activePlants} community={communityRecord} realGarden={realGarden} selectedPlot={selectedPlot} onCreateCommunity={() => openCommunity('create')} onJoinCommunity={() => openCommunity('join')} onSelect={selectPlant} onRegister={registerInPlot} onAction={gardenAction} onNavigate={navigateGarden} renderGardenScene={renderGardenScene} activities={data.activities} feedback={feedback} progress={{ points: progress.points, level: progress.level, responsible: communityRecord?.responsible }} interactionBlocked={Boolean(registration || detail || editingPlant || activityForm)} terrainProvince={realGardenDraft.province} terrainView={screen === 'Mi terreno' ? <RealGardenPage garden={realGarden} draft={realGardenDraft} onDraftChange={setRealGardenDraft} community={communityRecord} onSave={saveGarden} onConnect={connectGarden} plantRegistrationPending={Boolean(pendingRegistration)} onCommunity={() => goto('Comunidades')}/> : undefined}/>
      : screen === 'Comunidades' ? <CommunitiesPage demo={!authenticated} entryAction={communityEntry} community={communityRecord} garden={realGarden?.name ?? ''} onSave={saveCommunity} onGarden={() => goto('Mi terreno')} onHome={() => goto('Inicio')}/>
      : <main className="main garden-module"><header className="topbar"><span className="breadcrumbs">Kawsapacha / {screen === 'Mi historia' || screen === 'Mi camino verde' ? 'Mi camino verde' : screen === 'Bitácora' || screen === 'Mis plantas' || screen === 'Plantas medicinales' ? 'Mi Huerto Vivo' : screen}</span><span className="user-pill">{authenticated ? 'Sesión confirmada' : 'Modo visitante · Sin sesión'}</span></header><div className="page">
        <div className="prototype-alert">Guardado en este navegador · No sincronizado con otras personas ni con una cuenta.</div>
        <div className="heading"><div><span className="eyebrow">Kawsapacha · {screen === 'Mi historia' || screen === 'Mi camino verde' ? 'Mi camino verde' : 'Mi Huerto Vivo'}</span><h1 tabIndex={-1} data-screen-heading>{screen === 'Plantas medicinales' ? 'Catálogo de plantas medicinales' : screen === 'Bitácora' ? 'Bitácora agrícola' : screen === 'Mi historia' || screen === 'Mi camino verde' ? 'Mi camino verde' : screen}</h1></div><button className="cta small" onClick={() => goto('Inicio')}>Volver a Mi Huerto Vivo <span aria-hidden>↗</span></button></div>
        {(screen === 'Plantas medicinales' || screen === 'Mis plantas' || screen === 'Bitácora') && <nav className="garden-internal-nav" aria-label="Secciones de Mi Huerto Vivo">
          <button type="button" onClick={() => goto('Inicio')}>Jardín</button><button type="button" onClick={() => goto('Mi terreno')}>Editar terreno</button><button type="button" aria-current={screen === 'Plantas medicinales' ? 'page' : undefined} onClick={() => goto('Plantas medicinales')}>Catálogo</button><button type="button" aria-current={screen === 'Mis plantas' ? 'page' : undefined} onClick={() => goto('Mis plantas')}>Mis plantas</button><button type="button" aria-current={screen === 'Bitácora' ? 'page' : undefined} onClick={() => goto('Bitácora')}>Bitácora</button>
        </nav>}
        {(screen === 'Mi camino verde' || screen === 'Mi historia') && <><GardenProgress journal={data}/><GreenChallenges onNavigate={navigateGarden} onAction={gardenAction}/></>}
        {screen === 'Mis plantas' && <GardenPlants plants={plants} onRegister={() => registerInPlot()} onSelect={selectPlant}/>}
        {screen === 'Bitácora' && <GardenHistory plants={plants} activities={data.activities} onActivity={() => openActivity()} onVoid={voidActivity} onRegister={() => registerInPlot()} onSelect={selectPlant} onRealGarden={() => goto('Mi terreno')}/>}
        {screen === 'Plantas medicinales' && <section className="section"><div className="catalog-header"><div><span className="eyebrow">BOTÁNICA</span><h2>Explora las especies</h2><p>Elige la especie de tu planta; la fotografía no la identifica automáticamente.</p></div><label className="search-label"><span>⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por nombre…" aria-label="Buscar plantas"/></label></div><div className="catalog-grid">{visible.map((species, index) => <article className="species-card" key={species.name}><div className={`species-art tone-${index % 4}`}><span>{species.icon}</span></div><div className="species-copy"><strong>{species.name}</strong><em>{species.latin}</em><button onClick={() => registerInPlot(undefined, species.name)}>Registrar en mi huerto ↗</button></div></article>)}</div>{!visible.length && <p>No se encontraron especies con ese nombre.</p>}</section>}
      </div></main>}
    {registration && <PlantRegistrationModal plants={activePlants} initialPlot={registration.plot} initialSpecies={registration.species} initialPhoto={registration.photo} initialPlantedOn={registration.plantedOn} initialSowing={registration.recordSowing} initialResponsible={registration.responsible ?? communityRecord?.responsible ?? ''} initialRequestId={registration.requestId} notice={registration.notice} ready={ready} onConfirm={addPlant} onClose={() => setRegistration(null)} onSetup={draft => { setPendingRegistration(draft); goto('Mi terreno') }}/>}
    {editingPlant && <PlantEditor plant={editingPlant} plants={plants} onSave={updatePlant} onClose={() => { setEditingId(null); setDetailId(editingPlant.id) }}/>}
    {activityForm && <ActivityModal plants={activePlants} gardenId={data.gardenId} responsible={communityRecord?.responsible ?? ''} initialPlant={plants.find(plant => plant.id === activityForm.plantId)} initialPlot={activityForm.plot} onSave={saveActivity} onClose={() => setActivityForm(null)} onRegister={(plot, type) => { setActivityForm(null); registerInPlot(plot); setRegistration(current => current ? { ...current, recordSowing: type === 'sowing', plantedOn: type === 'sowing' ? localDate() : '', responsible: communityRecord?.responsible ?? '' } : current) }}/>}
    <PlantPassport plant={detail} onClose={() => setDetailId(null)} onHistory={() => goto('Bitácora')} onEdit={detail ? () => { setEditingId(detail.id); setDetailId(null) } : undefined} onArchive={detail ? archivePlant : undefined} onRestore={detail ? restorePlant : undefined} onActivity={detail ? () => openActivity(detail) : undefined} activityItems={detail ? <section aria-label="Actividades de esta planta"><h3>Actividades de esta planta</h3><ActivityList activities={data.activities.filter(activity => activity.target.kind === 'plant' && activity.target.plantId === detail.id)} plants={plants}/></section> : undefined}/>
    <div className="garden-storage-status" role="status" aria-label="Estado de guardado" data-state={journal.failure ? 'error' : journal.saving ? 'saving' : 'saved'}>{journal.failure || (journal.saving ? 'Guardando en este navegador…' : notice || 'Guardado local · Solo en este navegador')}</div>
  </div>
}
