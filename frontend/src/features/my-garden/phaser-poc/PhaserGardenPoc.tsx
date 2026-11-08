import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { GardenSceneRendererProps } from '../garden-scene-renderer'
import { SOIL_OPTIONS, IRRIGATION_OPTIONS, formatGardenArea } from '../../real-gardens/real-garden'
import { GARDEN_FEATURE_OPTIONS } from '../../real-gardens/garden-characteristics'
import { GARDEN_REGIONS } from '../../real-gardens/garden-region'
import GardenIcon from '../GardenIcon'
import { LAYOUT_PROFILES } from './layouts'
import { GardenSceneBridge, type CameraState, type SceneCommand } from './bridge'
import { toGardenVisualModel } from './adapter'
import type { SlotId } from './model'
import { GARDEN_GUIDES } from '../garden-guides'
import './phaser-poc.css'
import './garden-live.css'

export default function PhaserGardenPoc(props: GardenSceneRendererProps & { renderer?: 'auto' | 'canvas' }) {
  const { realGarden, plants, selectedPlot, interactionBlocked, activities, feedback, progress, renderer = 'auto' } = props
  const model = useMemo(() => toGardenVisualModel(realGarden, plants, activities), [realGarden, plants, activities])
  const playedFeedback = useRef<string | null>(null)
  const host = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const slotButtons = useRef<(HTMLButtonElement | null)[]>([])
  const current = useRef({ props, model })
  current.current = { props, model }
  const [bridge] = useState(() => new GardenSceneBridge({ model, selected: null, blocked: interactionBlocked }))
  const [ready, setReady] = useState(false)
  const [engine, setEngine] = useState('')
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [camera, setCamera] = useState<CameraState>({ zoom: 1, left: 0, top: 0 })
  const [components, setComponents] = useState<string[]>([])
  const [hovered, setHovered] = useState<SlotId | null>(null)
  const [focused, setFocused] = useState<SlotId | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const hintId = useId()
  const infoId = useId()
  const helpId = useId()
  const profile = LAYOUT_PROFILES[model.kind]
  const contextual = !interactionBlocked && !infoOpen && !helpOpen ? model.slots.find(slot => slot.id === (hovered ?? focused)) : undefined
  function labels(key: keyof typeof model.characteristics) {
    const options = GARDEN_FEATURE_OPTIONS[key] as Record<string, string>
    return model.characteristics[key].map(value => options[value]).join(' · ') || 'Sin selección registrada'
  }

  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [])

  useEffect(() => {
    const unsubscribe = bridge.onEvent(event => {
      if (event.type === 'ready') { setReady(true); setEngine(event.renderer) }
      if (event.type === 'camera') setCamera(event.camera)
      if (event.type === 'hover-slot') setHovered(event.slot)
      if (event.type === 'rendered') setComponents(event.components)
      if (event.type === 'asset-error') setWarning('No se pudo cargar ' + event.asset + '. Tus registros siguen disponibles.')
      if (event.type === 'activate-slot') {
        const latest = current.current
        if (latest.props.interactionBlocked) return
        const slot = latest.model.slots.find(item => item.id === event.slot)
        if (!slot) return
        // Real HTML openers allow the existing dialogs to restore keyboard focus.
        slotButtons.current[slot.plot]?.focus({ preventScroll: true })
        const plant = latest.props.plants.find(item => item.plot === slot.plot)
        if (plant) latest.props.onSelect(plant)
        else latest.props.onRegister(slot.plot)
      }
    })
    let cancelled = false
    let destroy: (() => void) | undefined
    setReady(false)
    import('./createGardenGame').then(({ createGardenGame }) => {
      if (cancelled || !host.current) return
      destroy = createGardenGame(host.current, bridge, renderer)
    }).catch(() => { if (!cancelled) setError('No se pudo iniciar el escenario. Utiliza la selección accesible del jardín.') })
    return () => { cancelled = true; unsubscribe(); destroy?.() }
  }, [bridge, renderer])

  useEffect(() => {
    bridge.command({ type: 'snapshot', snapshot: { model, selected: selectedPlot === null ? null : `garden-slot-${selectedPlot}`, blocked: interactionBlocked } })
  }, [bridge, model, selectedPlot, interactionBlocked])
  useEffect(() => {
    if (!ready || interactionBlocked || !feedback || playedFeedback.current === feedback.id) return
    playedFeedback.current = feedback.id
    bridge.command({ type: 'feedback', id: feedback.id, activity: feedback.type, plot: feedback.plot, reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches })
  }, [bridge, ready, feedback, interactionBlocked])

  function command(value: SceneCommand) { bridge.command(value) }
  function stageKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    const pans: Record<string, [number, number]> = { ArrowLeft: [-90, 0], ArrowRight: [90, 0], ArrowUp: [0, -90], ArrowDown: [0, 90] }
    if (event.target !== event.currentTarget || interactionBlocked) return
    if (event.key in pans) { event.preventDefault(); const [x, y] = pans[event.key]; command({ type: 'pan', x, y }) }
    else if (event.key === '+' || event.key === '=') { event.preventDefault(); command({ type: 'zoom', factor: 1.2 }) }
    else if (event.key === '-') { event.preventDefault(); command({ type: 'zoom', factor: 1 / 1.2 }) }
    else if (event.key === 'Home') { event.preventDefault(); command({ type: 'reset-camera' }) }
  }
  function slotKeyboard(event: KeyboardEvent<HTMLButtonElement>, plot: number) {
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 5 : event.key in offsets ? Math.max(0, Math.min(5, plot + offsets[event.key])) : null
    if (next !== null) { event.preventDefault(); slotButtons.current[next]?.focus({ preventScroll: true }) }
  }

  return <section className="garden-poc" aria-label={'Mi Jardín: ' + profile.label} data-region={model.region} data-kind={model.kind}>
    <div className="garden-poc-world">
      <div ref={host} className="garden-poc-stage" role="group" aria-label="Escenario semiisométrico" aria-describedby={hintId} tabIndex={0} onKeyDown={stageKeyboard} onPointerDown={event => event.currentTarget.focus({ preventScroll: true })}
        data-activity-source={model.activitySource} data-feedback={feedback?.type ?? "none"} data-ready={ready} data-renderer={engine} data-zoom={camera.zoom} data-world-left={camera.left} data-world-top={camera.top} data-components={components.join(' ')} data-kind={model.kind} data-soil={model.soilType ?? 'not-recorded'}>
        {!ready && !error && <p className="garden-poc-loading" role="status">Preparando el paisaje de tu región…</p>}
      </div>
      <header className="garden-poc-heading">
        <span className="garden-poc-crest" aria-hidden="true"><GardenIcon name="garden"/></span>
        <div><h1 ref={heading} tabIndex={-1}>Mi Jardín</h1><p>{model.name}</p><small><GardenIcon name="map"/>{model.location.province} · {formatGardenArea(model.areaM2)}</small></div>
      </header>
      <span className="garden-poc-modality"><GardenIcon name={profile.icon}/>{profile.label}<span>{GARDEN_REGIONS[model.region].label}</span></span>
      {progress && <output className="garden-poc-progress" aria-label="Semillas de vida locales" title={'Progreso local de ' + (progress.responsible ?? 'las actividades registradas')}><GardenIcon name="leaf"/><strong>{progress.points}</strong><span>Semillas de vida<small>{progress.level} · Local</small></span></output>}
      <div className="garden-poc-world-actions">
        <button type="button" aria-label="Ver características de mi terreno" aria-controls={infoId} aria-expanded={infoOpen} onClick={() => { setInfoOpen(!infoOpen); setHelpOpen(false) }}><GardenIcon name="map"/><span>Mi terreno</span></button>
        <button type="button" aria-label="Ayuda del jardín" aria-controls={helpId} aria-expanded={helpOpen} onClick={() => { setHelpOpen(!helpOpen); setInfoOpen(false) }}>?</button>
      </div>
      <div className="garden-poc-toolbar" role="group" aria-label="Cámara del jardín">
        <button type="button" aria-label="Acercar +" title="Acercar" disabled={!ready || interactionBlocked} onClick={() => command({ type: 'zoom', factor: 1.2 })}>+</button>
        <button type="button" aria-label="Alejar −" title="Alejar" disabled={!ready || interactionBlocked} onClick={() => command({ type: 'zoom', factor: 1 / 1.2 })}>−</button>
        <button type="button" aria-label="Centrar terreno" title="Centrar terreno" disabled={!ready || interactionBlocked} onClick={() => { command({ type: 'reset-camera' }); setFocused(null); command({ type: 'clear-focus' }) }}>⌖</button>
        <output aria-label="Nivel de zoom">{Math.round(camera.zoom * 100)} %</output>
      </div>
      <div className="garden-poc-record-count"><GardenIcon name="leaf"/>{plants.length ? plants.length + (plants.length === 1 ? ' planta registrada' : ' plantas registradas') : 'Tu tierra, una historia por comenzar'}<small>{plants.length ? 'Fotografías de tu huerto real' : 'Selecciona una zona para registrar tu primera planta'}</small></div>
      <button type="button" className="garden-poc-guide" data-guide-region={model.region} aria-label={'Consejo del guía de ' + GARDEN_REGIONS[model.region].label} aria-expanded={helpOpen} aria-controls={helpId} onClick={() => { setHelpOpen(!helpOpen); setInfoOpen(false) }}>
        <img src={GARDEN_GUIDES[model.region]} alt="" aria-hidden="true"/><span>Tu huerto cuenta una historia<small>¿Exploramos juntos?</small></span>
      </button>
      {contextual && <div className="garden-poc-context" role="status" style={{ left: Math.max(100, Math.min((host.current?.clientWidth ?? 400) - 100, (contextual.anchor.x - camera.left) * camera.zoom)), top: Math.max(185, Math.min((host.current?.clientHeight ?? 600) - 130, (contextual.anchor.y - camera.top) * camera.zoom - 35)) }}>
        <GardenIcon name={contextual.plant ? 'leaf' : 'seed'}/><strong>{contextual.plant?.name ?? 'Aquí comienza una vida'}</strong><span>{contextual.plant ? 'Abrir Pasaporte Vivo' : 'Registrar una planta'}</span>
      </div>}
      <p id={hintId} className="garden-poc-sr-only">Arrastra o usa las flechas para mover la cámara, + y − para ampliar e Inicio para centrar. Pulsa Tab para seleccionar una zona; Enter abre el registro o el Pasaporte Vivo.</p>
      {helpOpen && <div id={helpId} className="garden-poc-help garden-poc-panel">
        <strong>Explora tu jardín</strong><p>Arrastra para desplazarte. Usa la rueda o + y − para ampliar. Selecciona una zona para registrar una planta o consultar su Pasaporte Vivo.</p><p>Teclado: flechas para mover la cámara, +/− para ampliar e Inicio para centrar. Pulsa Tab para recorrer las seis zonas; las flechas, Inicio y Fin cambian la selección. Enter abre su formulario.</p>
        <button type="button" onClick={() => { setHelpOpen(false); slotButtons.current[0]?.focus({ preventScroll: true }) }}>Seleccionar una zona con teclado</button>
      </div>}
      {infoOpen && <aside id={infoId} className="garden-poc-data garden-poc-panel" aria-label="Características de mi terreno">
        <div className="garden-poc-panel-heading"><h3>Tu huerto real</h3><button type="button" aria-label="Cerrar características" onClick={() => setInfoOpen(false)}>×</button></div>
        <dl>
          <div><dt>Ubicación registrada</dt><dd>{[model.location.province, model.location.canton, model.location.parish].filter(Boolean).join(' · ')}</dd></div>
          <div><dt>Modalidad y superficie</dt><dd>{profile.label} · {formatGardenArea(model.areaM2)}</dd></div>
          {model.kind === 'ground' && <><div><dt>Suelo</dt><dd>{model.soilType ? SOIL_OPTIONS[model.soilType] : 'Sin selección registrada'}</dd></div><div><dt>Distribución en tierra</dt><dd>{labels('groundDesigns')}</dd></div></>}
          <div><dt>Agua disponible</dt><dd>{IRRIGATION_OPTIONS[model.irrigationAvailability]}</dd></div><div><dt>Fuente de agua</dt><dd>{labels('waterSources')}</dd></div>
          <div><dt>Método de riego</dt><dd>{labels('irrigationMethods')}</dd></div><div><dt>Cercas</dt><dd>{labels('fences')}</dd></div><div><dt>Abono natural</dt><dd>{labels('naturalFertilizers')}</dd></div>
        </dl><p>Composición ilustrativa de las características registradas; no acredita dimensiones exactas. Los datos y las fotografías se guardan en este navegador.</p>
      </aside>}
      {error && <p className="garden-poc-alert" role="alert">{error}</p>}{warning && <p className="garden-poc-alert" role="status">{warning}</p>}
      <div className={error ? 'garden-poc-accessible garden-poc-accessible--fallback' : 'garden-poc-accessible garden-poc-sr-only'} role="group" aria-label="Selección accesible de las seis zonas de cultivo">
        {model.slots.map(slot => <button key={slot.id} type="button" className="garden-poc-slot" ref={element => { slotButtons.current[slot.plot] = element }} aria-disabled={interactionBlocked}
          data-slot-id={slot.id} data-plant-id={slot.plant?.id} data-plot-index={slot.plot} data-world-x={slot.anchor.x} data-world-y={slot.anchor.y}
          onFocus={() => { setFocused(slot.id); command({ type: 'focus-slot', slot: slot.id }) }} onBlur={() => { setFocused(null); command({ type: 'clear-focus' }) }}
          onKeyDown={event => slotKeyboard(event, slot.plot)} onClick={() => bridge.emit({ type: 'activate-slot', slot: slot.id })} aria-haspopup="dialog">
          {slot.plant ? slot.plant.name + ' · Pasaporte Vivo' : 'Zona de cultivo ' + (slot.plot + 1) + ' · Registrar una planta'}
        </button>)}
      </div>
    </div>
    <p className="garden-poc-note">Tu huerto real, reflejado en cada registro · Guardado local en este navegador</p>
  </section>
}
