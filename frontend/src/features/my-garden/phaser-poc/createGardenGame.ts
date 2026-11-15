import { coastalFootprintRatio } from './coastal-terrain'
import { COASTAL_RELIEF_ART, COASTAL_RELIEF_KEY, isCoastalRelief } from './coastal-terrain'
import Phaser from 'phaser'
import { GardenSceneBridge, type SceneCommand } from './bridge'
import { ACTIVITY_TOOL_ASSETS, REGIONAL_POTS_ART, REGIONAL_PAD_ART, REGIONAL_BASKETS_ART, REGIONAL_TROUGHS_ART, REGIONAL_SUPPORTS_ART, BED_ART, BORDER_ART, COSTA_FENCE_ART, COSTA_MARSH_PLOT_ART, COSTA_PLOT_ART, INFRASTRUCTURE_ART, LANDSCAPES, MATERIAL_ART, MODULAR_ART, ORGANIC_SOIL_ART, PERGOLA_ART, POTS_ART, SUPPLIES_ART, TRELLIS_ART, TROUGH_ART, WORLD } from './assets'
import { LAYOUT_PROFILES } from './layouts'
import { GardenScenePainter } from './scene-painter'
import type { GardenVisualModel, SlotId } from './model'

class ModularGardenScene extends Phaser.Scene {
  private painter: GardenScenePainter | null = null
  private failedAssets = new Set<string>()
  private requestedAssets = new Set<string>()
  private ready = false
  private drag: { x: number; y: number; lastX: number; lastY: number; moved: boolean } | null = null
  private activePointers = new Map<number, { x: number; y: number }>()
  private pinch: { distance: number; zoom: number } | null = null
  private suppressClick = false
  private mobileBaseZoom = 1
  private mobileMaxZoom = 1
  private hovered: SlotId | null = null
  private focused: SlotId | null = null
  private lastCamera = ''
  private viewportSize = ''
  private lastDrawnModel: GardenVisualModel | null = null

  constructor(private bridge: GardenSceneBridge) { super('modular-garden-poc') }

  preload() {
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      this.failedAssets.add(file.key)
      this.bridge.emit({ type: 'asset-error', asset: file.key.startsWith('evidence-') ? 'fotografía' : 'paisaje o suelo' })
    })
    this.queueAssets()
  }

  create() {
    this.painter = new GardenScenePainter(this)
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height).setBackgroundColor('#28462c')
    this.ready = true
    this.input.enabled = !this.bridge.snapshot.blocked
    // Phaser only tracks one touch pointer by default. Enable two-finger pinch.
    this.input.addPointer(2)
    this.load.on(Phaser.Loader.Events.COMPLETE, this.draw, this)
    const unsubscribe = this.bridge.onCommand(command => this.receive(command))
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeCamera, this)
    this.game.events.on(Phaser.Core.Events.POST_RENDER, this.publishCamera, this)
    // Phaser's wheel listener is passive when preventDefaultWheel is false.
    // Cancel page scrolling separately, while preserving Ctrl+wheel accessibility.
    const preventPageScroll = (event: WheelEvent) => {
      if (event.ctrlKey || this.bridge.snapshot.blocked) return
      event.preventDefault()
      if (this.isMobileCamera()) this.zoomMobile(this.cameras.main.zoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12), event.offsetX, event.offsetY)
    }
    this.game.canvas.addEventListener('wheel', preventPageScroll, { passive: false })
    // A React layout change or page scroll can move the canvas between Phaser
    // frames. Refresh its DOM bounds before native input is transformed.
    const refreshInputBounds = () => this.scale.updateBounds()
    this.game.canvas.addEventListener('pointerdown', refreshInputBounds, true)
    this.game.canvas.addEventListener('pointermove', refreshInputBounds, true)
    window.addEventListener('scroll', refreshInputBounds, { capture: true, passive: true })
    const release = () => {
      this.ready = false
      unsubscribe()
      this.game.events.off(Phaser.Core.Events.POST_RENDER, this.publishCamera, this)
      this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeCamera, this)
      this.game.canvas.removeEventListener('wheel', preventPageScroll)
      this.game.canvas.removeEventListener('pointerdown', refreshInputBounds, true)
      this.game.canvas.removeEventListener('pointermove', refreshInputBounds, true)
      window.removeEventListener('scroll', refreshInputBounds, true)
      this.painter?.destroy()
      this.painter = null
      this.lastDrawnModel = null
      this.activePointers.clear()
      this.drag = null
      this.pinch = null
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, release)
      this.events.off(Phaser.Scenes.Events.DESTROY, release)
    }
    // Game.destroy emits DESTROY directly; a stopped scene emits SHUTDOWN.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, release)
    this.events.once(Phaser.Scenes.Events.DESTROY, release)

    // Desktop stays click-only. Mobile enables bounded drag and two-finger zoom.
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.bridge.snapshot.blocked) return
      if (this.isMobileCamera()) {
        this.activePointers.set(pointer.id, { x: pointer.x, y: pointer.y })
        if (this.activePointers.size > 1) {
          const [a, b] = [...this.activePointers.values()]
          this.pinch = { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), zoom: this.cameras.main.zoom }
          this.suppressClick = true
          this.drag = null
          this.setHover(null)
          return
        }
      }
      if (!pointer.primaryDown) return
      this.drag = { x: pointer.x, y: pointer.y, lastX: pointer.x, lastY: pointer.y, moved: false }
    })
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isMobileCamera() && this.activePointers.has(pointer.id)) {
        this.activePointers.set(pointer.id, { x: pointer.x, y: pointer.y })
        if (this.activePointers.size > 1 && this.pinch) {
          const [a, b] = [...this.activePointers.values()]
          const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y))
          this.zoomMobile(this.pinch.zoom * distance / this.pinch.distance, (a.x + b.x) / 2, (a.y + b.y) / 2)
          this.setHover(null)
          return
        }
        if (this.drag && pointer.isDown) {
          const dx = pointer.x - this.drag.lastX
          const dy = pointer.y - this.drag.lastY
          this.drag.moved ||= Math.hypot(pointer.x - this.drag.x, pointer.y - this.drag.y) > 8
          this.drag.lastX = pointer.x
          this.drag.lastY = pointer.y
          if (this.drag.moved) {
            this.panMobile(dx, dy)
            this.setHover(null)
            return
          }
        }
      } else if (this.drag && pointer.isDown) {
        this.drag.moved ||= Math.hypot(pointer.x - this.drag.x, pointer.y - this.drag.y) > 8
      }
      if (this.isMobileCamera() && (this.suppressClick || this.drag?.moved)) { this.setHover(null); return }
      const slot = this.pickSlot(pointer)
      this.setHover(this.drag?.moved ? null : slot?.id ?? null)
      this.game.canvas.style.cursor = slot && !this.drag?.moved ? 'pointer' : 'default'
    })
    const releasePointer = (pointer: Phaser.Input.Pointer, inside: boolean) => {
      const wasClick = inside && Boolean(this.drag && !this.drag.moved && !this.suppressClick)
      if (this.isMobileCamera()) {
        this.activePointers.delete(pointer.id)
        if (this.activePointers.size < 2) this.pinch = null
        if (this.activePointers.size === 0) this.suppressClick = false
      }
      this.drag = null
      if (!wasClick || this.bridge.snapshot.blocked) return
      const slot = this.pickSlot(pointer)
      if (slot) this.bridge.emit({ type: 'activate-slot', slot: slot.id })
    }
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => releasePointer(pointer, true))
    this.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => releasePointer(pointer, false))
    this.input.on('gameout', () => this.setHover(null))
    this.syncAssets()
    this.draw()
    this.resetCamera()
    this.cameras.main.preRender()
    this.publishCamera()
    this.game.canvas.setAttribute('aria-hidden', 'true')
    this.bridge.emit({ type: 'ready', renderer: this.game.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas' })
    // Los implementos opcionales se cargan DESPUÉS de emitir ready.
    // Un SVG defectuoso jamás bloquea el jardín o sus seis parcelas.
    this.time.delayedCall(800, () => { if (this.ready) this.loadActivityTools() })
  }

  private receive(command: SceneCommand) {
    if (command.type === 'snapshot') {
      this.input.enabled = !command.snapshot.blocked
      if (command.snapshot.blocked) {
        this.drag = null
        this.pinch = null
        this.activePointers.clear()
        this.suppressClick = false
        this.setHover(null)
      }
      // Abrir/cerrar un modal o cambiar selección no altera el huerto.
      // Reconstruir todo el paisaje y sus texturas para esos cambios
      // bloqueaba la página durante recorridos largos de Playwright.
      if (command.snapshot.model === this.lastDrawnModel) {
        this.drawEffects()
        return
      }
      this.syncAssets()
      this.draw()
      return
    }
    if (this.bridge.snapshot.blocked) return
    if (command.type === 'feedback') { this.painter?.feedback(this.bridge.snapshot.model, command.activity, command.plot, command.reducedMotion); return }
    // Desktop retains its existing fixed composition. Only mobile uses pan/zoom.
    if (command.type === 'zoom' && this.isMobileCamera()) {
      this.zoomMobile(this.cameras.main.zoom * command.factor, this.scale.width / 2, this.scale.height / 2)
      return
    }
    if (command.type === 'pan' && this.isMobileCamera()) {
      this.panMobile(command.x, command.y)
      return
    }
    if (command.type === 'reset-camera') { this.resetCamera(); this.publishCamera(); return }
    if (command.type === 'focus-slot') {
      this.focused = command.slot
      this.drawEffects()
    }
    if (command.type === 'clear-focus') { this.focused = null; this.drawEffects() }
  }

  private queueAssets() {
    const model = this.bridge.snapshot.model
    const needed: [string, string][] = [
      [`landscape-${model.region}`, LANDSCAPES[model.region]],
      ['modular-props', MODULAR_ART], ['regional-borders', BORDER_ART],
      ['ground-materials', MATERIAL_ART],
      ['organic-soil', ORGANIC_SOIL_ART],
    ]
    if (model.kind === 'ground') {
      if (model.region === 'costa' || model.slots.some(slot => slot.design === null)) {
        if (model.soilType === 'marsh') needed.push(['costa-plot-marsh', COSTA_MARSH_PLOT_ART])
        else COSTA_PLOT_ART.forEach((url, plot) => needed.push([`costa-plot-${plot}`, url]))
      }
      // Load only the registered relief artwork; beds keep their approved PNGs.
      for (const design of new Set(model.slots.map(slot => slot.design))) {
        if (isCoastalRelief(design)) needed.push([COASTAL_RELIEF_KEY[design], COASTAL_RELIEF_ART[design]])
      }
    }
    if (model.region === 'costa' && model.characteristics.fences.some(kind => kind === 'living')) needed.push(['costa-fence-flora', COSTA_FENCE_ART.foliage])
    if (model.region === 'costa' && model.characteristics.fences.some(kind => kind === 'metal' || kind === 'conventional')) {
      needed.push(['costa-fence-segment', COSTA_FENCE_ART.segment], ['costa-fence-corner', COSTA_FENCE_ART.corner], ['costa-fence-gate', COSTA_FENCE_ART.gate])
    }
    if (model.kind === 'ground' && model.region !== 'costa' && model.characteristics.groundDesigns.includes('beds')) needed.push(['empty-bed', BED_ART])
    if (model.kind === 'pots') {
      needed.push([`regional-pad-${model.region}`, REGIONAL_PAD_ART[model.region]])
      // Sierra retains its approved ceramic atlas, other regions use local materials.
      needed.push(['empty-pots', POTS_ART])
      const art = REGIONAL_POTS_ART[model.region]
      if (art) needed.push([`regional-pots-${model.region}`, art])
    }
    if (model.kind === 'hanging') {
      needed.push(['empty-pots', POTS_ART], ['garden-pergola', PERGOLA_ART])
      needed.push([`regional-baskets-${model.region}`, REGIONAL_BASKETS_ART[model.region]])
      needed.push([`regional-hanging-${model.region}`, REGIONAL_SUPPORTS_ART[model.region].hanging])
    }
    if (model.kind === 'vertical') {
      needed.push(['empty-trough', TROUGH_ART], ['garden-trellis', TRELLIS_ART])
      needed.push([`regional-trough-${model.region}`, REGIONAL_TROUGHS_ART[model.region]])
      needed.push([`regional-vertical-${model.region}`, REGIONAL_SUPPORTS_ART[model.region].vertical])
    }
    if (model.characteristics.naturalFertilizers.some(value => value !== 'fallow') || model.characteristics.irrigationMethods.some(value => value === 'manual' || value === 'hose' || value === 'sprinkler')) needed.push(['garden-supplies', SUPPLIES_ART])
    if (model.characteristics.fences.some(value => value !== 'natural') || model.characteristics.waterSources.some(value => value === 'well' || value === 'mains')) needed.push(['garden-infrastructure', INFRASTRUCTURE_ART])
    needed.forEach(([key, url]) => {
      if (!this.textures.exists(key) && !this.failedAssets.has(key) && !this.requestedAssets.has(key)) {
        this.requestedAssets.add(key)
        this.load.image(key, url)
      }
    })
  }

  private syncAssets() {
    this.queueAssets()
    if (!this.load.isLoading() && this.load.list.size) this.load.start()
  }

  private loadActivityTools() {
    for (const [activity, url] of Object.entries(ACTIVITY_TOOL_ASSETS)) {
      const key = 'activity-tool-' + activity
      if (this.textures.exists(key) || this.failedAssets.has(key) || this.requestedAssets.has(key)) continue
      try {
        this.requestedAssets.add(key)
        this.load.svg(key, url, { width: 240, height: 220 })
      } catch (cause) {
        this.failedAssets.add(key)
        console.warn('[Kawsapacha] Implemento SVG no disponible; se conserva el efecto vectorial.', activity, cause)
      }
    }
    if (!this.load.isLoading() && this.load.list.size) this.load.start()
  }

  private draw() {
    if (!this.ready || !this.painter) return
    const model = this.bridge.snapshot.model
    try {
      this.painter.draw(model)
      this.lastDrawnModel = model
      this.painter.updateHorizon(this.cameras.main)
      this.drawEffects()
      this.bridge.emit({ type: 'rendered', components: [...this.painter.components] })
      if (model.region === 'costa') this.logCoastalRender(model)
    } catch (error) {
      // Keep the original exception visible to Phaser while reporting the exact
      // painter phase and complete stack in DevTools for manual diagnosis.
      const stage = this.painter.lastRenderStage
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[Kawsapacha][Phaser] render failed at ${stage}`, error)
      this.bridge.emit({ type: 'render-error', stage, message })
      throw error
    }
  }

  private logCoastalRender(model: GardenSceneBridge['snapshot']['model']) {
    const camera = this.cameras.main
    const topLeft = camera.getWorldPoint(0, 0)
    const right = topLeft.x + camera.width / camera.zoom
    const bottom = topLeft.y + camera.height / camera.zoom
    const surfaceKey = 'garden-art:courtyard-costa-cohesive-v5'
    const surface = this.textures.exists(surfaceKey) ? this.textures.get(surfaceKey).getSourceImage() as HTMLCanvasElement : null
    const alpha = surface?.getContext('2d')?.getImageData(960, 1000, 1, 1).data[3] ?? null
    console.info('[Kawsapacha][Phaser] Costa draw complete', {
      kind: model.kind,
      floorTextureExists: Boolean(surface),
      floorSampleAlphaAt960x1000: alpha,
      camera: { zoom: camera.zoom, left: topLeft.x, top: topLeft.y, right, bottom },
      slots: model.slots.map(slot => ({
        id: slot.id,
        x: slot.anchor.x,
        y: slot.anchor.y,
        visible: slot.anchor.x >= topLeft.x && slot.anchor.x <= right && slot.anchor.y >= topLeft.y && slot.anchor.y <= bottom,
        created: this.painter?.components.has('slot:' + slot.id) ?? false,
      })),
      depths: { landscape: -99999, ground: -50000, parcels: 'slot.depth * 10' },
    })
  }

  private drawEffects() {
    if (this.ready) this.painter?.selection(this.bridge.snapshot.model, this.bridge.snapshot.selected ?? this.focused, this.hovered)
  }

  private setHover(slot: SlotId | null) {
    if (slot === this.hovered) return
    this.hovered = slot
    this.drawEffects()
    this.bridge.emit({ type: 'hover-slot', slot })
  }

  private pickSlot(pointer: Phaser.Input.Pointer) {
    const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
    const profile = LAYOUT_PROFILES[this.bridge.snapshot.model.kind]
    // Keep direct canvas targets at least 44 CSS pixels even on narrow screens.
    const ground = this.bridge.snapshot.model.kind === 'ground'
    const footprintRatio = ground ? coastalFootprintRatio(this.bridge.snapshot.model.footprintScale) : 1
    const hitX = Math.max(ground ? 160 * footprintRatio : profile.hitX, 22 / this.cameras.main.zoom)
    const hitY = Math.max(ground ? 74 * footprintRatio : profile.hitY, 22 / this.cameras.main.zoom)
    return this.bridge.snapshot.model.slots
      .map(slot => ({ slot, distance: Math.hypot((point.x - slot.anchor.x) / hitX, (point.y - slot.anchor.y) / hitY) }))
      .filter(item => item.distance <= 1)
      .sort((a, b) => a.distance - b.distance)[0]?.slot
  }

  private isMobileCamera() { return this.scale.width <= 700 }

  private clampMobileCamera() {
    const camera = this.cameras.main
    const width = this.scale.width / camera.zoom
    const height = this.scale.height / camera.zoom
    // When the portrait view is taller than the world, center the excess sky.
    const clamp = (scroll: number, dimension: number, visible: number) =>
      visible >= dimension ? (dimension - visible) / 2 : Phaser.Math.Clamp(scroll, 0, dimension - visible)
    camera.setScroll(clamp(camera.scrollX, WORLD.width, width), clamp(camera.scrollY, WORLD.height, height))
    camera.preRender()
  }

  private panMobile(dx: number, dy: number) {
    if (!this.isMobileCamera() || !this.ready || this.bridge.snapshot.blocked) return
    const camera = this.cameras.main
    camera.setScroll(camera.scrollX - dx / camera.zoom, camera.scrollY - dy / camera.zoom)
    this.clampMobileCamera()
    this.publishCamera()
  }

  private zoomMobile(next: number, screenX: number, screenY: number) {
    if (!this.isMobileCamera() || !this.ready || this.bridge.snapshot.blocked) return
    const camera = this.cameras.main
    const zoom = Phaser.Math.Clamp(next, this.mobileBaseZoom * .85, this.mobileMaxZoom)
    if (Math.abs(camera.zoom - zoom) < .0001) return
    const before = camera.getWorldPoint(screenX, screenY)
    camera.setZoom(zoom)
    camera.preRender()
    const after = camera.getWorldPoint(screenX, screenY)
    camera.setScroll(camera.scrollX + before.x - after.x, camera.scrollY + before.y - after.y)
    this.clampMobileCamera()
    this.publishCamera()
  }

  private resizeCamera() {
    // Browser scrolling can re-emit RESIZE without real dimension changes.
    if (`${this.scale.width}:${this.scale.height}` !== this.viewportSize) this.resetCamera()
  }

  private resetCamera() {
    if (!this.ready) return
    this.viewportSize = `${this.scale.width}:${this.scale.height}`
    this.drag = null
    this.pinch = null
    this.activePointers.clear()
    this.suppressClick = false
    if (this.isMobileCamera()) {
      const anchors = this.bridge.snapshot.model.slots.map(slot => slot.anchor)
      const xs = anchors.map(slot => slot.x)
      const ys = anchors.map(slot => slot.y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      // Keep all six plots visible between the compact header and action dock.
      const safeHeight = Math.max(160, this.scale.height - 340)
      const zoom = Math.max(.14, Math.min(
        (this.scale.width - 24) / (maxX - minX + 380),
        safeHeight / (maxY - minY + 360),
        1.1,
      ))
      this.mobileBaseZoom = zoom
      this.mobileMaxZoom = Math.max(zoom * 3, 1.15)
      this.cameras.main.setZoom(zoom).centerOn((minX + maxX) / 2, (minY + maxY) / 2)
      this.clampMobileCamera()
      return
    }
    const ground = this.bridge.snapshot.model.kind === 'ground'
    // Flat garden regions share a fit-to-width frame that keeps all six plots and the entry in view.
    const zoom = ground
      // Fit Costa to the viewport width. Height fitting can expose world X
      // beyond 0..WORLD.width on short windows, where the lawn ends abruptly.
      ? this.scale.width / WORLD.width
      : Math.max(
          Math.max(this.scale.width / WORLD.width, this.scale.height / WORLD.height, .2),
          Math.min(this.scale.width / 1750, this.scale.height / 1100, 1.3),
        )
    // En móvil, encuadrar los seis centros táctiles; no dejar fuera la última maceta.
    const anchors = this.bridge.snapshot.model.slots.map(slot => slot.anchor.x)
    const minSlotX = Math.min(...anchors)
    const maxSlotX = Math.max(...anchors)
    const slotWidth = Math.max(1, maxSlotX - minSlotX)
    const touchPadding = Math.min(44, this.scale.width * .12)
    const fittedZoom = ground ? zoom : Math.min(zoom, (this.scale.width - touchPadding) / slotWidth)
    const centerX = ground ? WORLD.width / 2 : (minSlotX + maxSlotX) / 2
    const centerY = ground ? 800 : WORLD.centerY
    this.cameras.main.setZoom(fittedZoom).centerOn(centerX, centerY)
  }

  private publishCamera() {
    if (!this.ready) return
    const camera = this.cameras.main
    const origin = camera.getWorldPoint(0, 0)
    this.painter?.updateHorizon(camera)
    const signature = `${camera.zoom}:${origin.x}:${origin.y}`
    if (signature === this.lastCamera) return
    this.lastCamera = signature
    this.bridge.emit({ type: 'camera', camera: { zoom: camera.zoom, left: origin.x, top: origin.y } })
  }
}

export function createGardenGame(parent: HTMLElement, bridge: GardenSceneBridge, renderer: 'auto' | 'canvas') {
  const game = new Phaser.Game({
    type: renderer === 'canvas' ? Phaser.CANVAS : Phaser.AUTO,
    parent,
    width: Math.max(1, parent.clientWidth),
    height: Math.max(1, parent.clientHeight),
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [new ModularGardenScene(bridge)],
    audio: { noAudio: true },
    input: { mouse: { preventDefaultWheel: false } },
    fps: { target: 30, forceSetTimeOut: false },
    render: { antialias: true, transparent: false },
    banner: false,
  })
  // Phaser's destroy also releases textures, input, renderer and its RAF loop.
  return () => { game.destroy(true) }
}
