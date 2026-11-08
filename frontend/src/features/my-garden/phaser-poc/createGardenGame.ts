import Phaser from 'phaser'
import { GardenSceneBridge, type SceneCommand } from './bridge'
import { BED_ART, BORDER_ART, COSTA_FENCE_ART, COSTA_MARSH_PLOT_ART, COSTA_PLOT_ART, INFRASTRUCTURE_ART, LANDSCAPES, MATERIAL_ART, MODULAR_ART, ORGANIC_SOIL_ART, PERGOLA_ART, POTS_ART, SUPPLIES_ART, TRELLIS_ART, TROUGH_ART, photoTextureKey, WORLD } from './assets'
import { LAYOUT_PROFILES } from './layouts'
import { GardenScenePainter } from './scene-painter'
import type { SlotId } from './model'

class ModularGardenScene extends Phaser.Scene {
  private painter: GardenScenePainter | null = null
  private failedAssets = new Set<string>()
  private requestedAssets = new Set<string>()
  private ready = false
  private drag: { x: number; y: number; moved: boolean } | null = null
  private hovered: SlotId | null = null
  private focused: SlotId | null = null
  private lastCamera = ''
  private viewportSize = ''

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
    this.load.on(Phaser.Loader.Events.COMPLETE, this.draw, this)
    const unsubscribe = this.bridge.onCommand(command => this.receive(command))
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeCamera, this)
    this.game.events.on(Phaser.Core.Events.POST_RENDER, this.publishCamera, this)
    // Phaser's wheel listener is passive when preventDefaultWheel is false.
    // Cancel page scrolling separately, while preserving Ctrl+wheel accessibility.
    const preventPageScroll = (event: WheelEvent) => {
      if (!event.ctrlKey && !this.bridge.snapshot.blocked) event.preventDefault()
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
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, release)
      this.events.off(Phaser.Scenes.Events.DESTROY, release)
    }
    // Game.destroy emits DESTROY directly; a stopped scene emits SHUTDOWN.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, release)
    this.events.once(Phaser.Scenes.Events.DESTROY, release)

    // Pointer movement is used only to distinguish a click from a drag.
    // Moving the pointer never moves the camera or the garden.
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.primaryDown || this.bridge.snapshot.blocked) return
      this.drag = { x: pointer.x, y: pointer.y, moved: false }
    })
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.drag && pointer.isDown) {
        this.drag.moved ||= Math.hypot(pointer.x - this.drag.x, pointer.y - this.drag.y) > 8
      }
      const slot = this.pickSlot(pointer)
      this.setHover(this.drag?.moved ? null : slot?.id ?? null)
      this.game.canvas.style.cursor = slot && !this.drag?.moved ? 'pointer' : 'default'
    })
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const wasClick = this.drag && !this.drag.moved
      this.drag = null
      if (!wasClick || this.bridge.snapshot.blocked) return
      const slot = this.pickSlot(pointer)
      if (slot) this.bridge.emit({ type: 'activate-slot', slot: slot.id })
    })
    this.input.on('pointerupoutside', () => { this.drag = null })
    this.input.on('gameout', () => this.setHover(null))
    this.syncAssets()
    this.draw()
    this.resetCamera()
    this.cameras.main.preRender()
    this.publishCamera()
    this.game.canvas.setAttribute('aria-hidden', 'true')
    this.bridge.emit({ type: 'ready', renderer: this.game.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas' })
  }

  private receive(command: SceneCommand) {
    if (command.type === 'snapshot') {
      this.input.enabled = !command.snapshot.blocked
      if (command.snapshot.blocked) { this.drag = null; this.setHover(null) }
      this.syncAssets()
      this.draw()
      return
    }
    if (this.bridge.snapshot.blocked) return
    if (command.type === 'feedback') { this.painter?.feedback(this.bridge.snapshot.model, command.activity, command.plot, command.reducedMotion); return }
    // Fixed composition: legacy pan/zoom commands have no effect.
    if (command.type === 'reset-camera') this.resetCamera()
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
    if (model.region === 'costa' && model.kind === 'ground') {
      if (model.soilType === 'marsh') needed.push(['costa-plot-marsh', COSTA_MARSH_PLOT_ART])
      else COSTA_PLOT_ART.forEach((url, plot) => needed.push([`costa-plot-${plot}`, url]))
    }
    if (model.region === 'costa' && model.characteristics.fences.some(kind => kind === 'living')) needed.push(['costa-fence-flora', COSTA_FENCE_ART.foliage])
    if (model.region === 'costa' && model.characteristics.fences.some(kind => kind === 'metal' || kind === 'conventional')) {
      needed.push(['costa-fence-segment', COSTA_FENCE_ART.segment], ['costa-fence-corner', COSTA_FENCE_ART.corner], ['costa-fence-gate', COSTA_FENCE_ART.gate])
    }
    if (model.kind === 'ground' && model.region !== 'costa' && model.characteristics.groundDesigns.includes('beds')) needed.push(['empty-bed', BED_ART])
    if (model.kind === 'pots' || model.kind === 'hanging') needed.push(['empty-pots', POTS_ART])
    if (model.kind === 'vertical') needed.push(['empty-trough', TROUGH_ART], ['garden-trellis', TRELLIS_ART])
    if (model.kind === 'hanging') needed.push(['garden-pergola', PERGOLA_ART])
    if (model.characteristics.naturalFertilizers.some(value => value !== 'fallow') || model.characteristics.irrigationMethods.some(value => value === 'manual' || value === 'hose' || value === 'sprinkler')) needed.push(['garden-supplies', SUPPLIES_ART])
    if (model.characteristics.fences.some(value => value !== 'natural') || model.characteristics.waterSources.some(value => value === 'well' || value === 'mains')) needed.push(['garden-infrastructure', INFRASTRUCTURE_ART])
    model.slots.forEach(slot => {
      if (slot.plant) needed.push([photoTextureKey(slot.plant.id, slot.plant.photo), slot.plant.photo])
    })
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

  private draw() {
    if (!this.ready || !this.painter) return
    const model = this.bridge.snapshot.model
    try {
      this.painter.draw(model)
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
    const coastalGround = this.bridge.snapshot.model.region === 'costa' && this.bridge.snapshot.model.kind === 'ground'
    const hitX = Math.max(coastalGround ? 178 : profile.hitX, 22 / this.cameras.main.zoom)
    const hitY = Math.max(coastalGround ? 78 : profile.hitY, 22 / this.cameras.main.zoom)
    return this.bridge.snapshot.model.slots
      .map(slot => ({ slot, distance: Math.hypot((point.x - slot.anchor.x) / hitX, (point.y - slot.anchor.y) / hitY) }))
      .filter(item => item.distance <= 1)
      .sort((a, b) => a.distance - b.distance)[0]?.slot
  }

  private resizeCamera() {
    // Phaser also emits RESIZE on a bounds refresh after page scrolling.
    // Keep the fixed framing until the viewport dimensions actually change.
    if (`${this.scale.width}:${this.scale.height}` !== this.viewportSize) this.resetCamera()
  }

  private resetCamera() {
    if (!this.ready) return
    this.viewportSize = `${this.scale.width}:${this.scale.height}`
    this.drag = null
    const coast = this.bridge.snapshot.model.region === 'costa'
    // Coast shows the complete flat cultivation area without hiding the horizon
    // or the front supports behind the React action bar.
    // Other regions preserve the existing initial framing until their art is adapted.
    const zoom = coast
      ? Math.min(this.scale.width / WORLD.width, this.scale.height / 1030)
      : Math.max(
          Math.max(this.scale.width / WORLD.width, this.scale.height / WORLD.height, .2),
          Math.min(this.scale.width / 1750, this.scale.height / 1100, 1.3),
        )
    const centerX = coast ? WORLD.width / 2 : WORLD.centerX
    const centerY = coast ? 800 : WORLD.centerY
    this.cameras.main.setZoom(zoom).centerOn(centerX, centerY)
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
