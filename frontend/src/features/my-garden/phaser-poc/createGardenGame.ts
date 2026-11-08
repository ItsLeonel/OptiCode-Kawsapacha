import Phaser from 'phaser'
import { GardenSceneBridge, type SceneCommand } from './bridge'
import { BED_ART, BORDER_ART, INFRASTRUCTURE_ART, LANDSCAPES, MATERIAL_ART, MODULAR_ART, ORGANIC_SOIL_ART, PERGOLA_ART, POTS_ART, SUPPLIES_ART, TRELLIS_ART, TROUGH_ART, photoTextureKey, WORLD } from './assets'
import { LAYOUT_PROFILES } from './layouts'
import { GardenScenePainter } from './scene-painter'
import type { SlotId } from './model'

class ModularGardenScene extends Phaser.Scene {
  private painter: GardenScenePainter | null = null
  private failedAssets = new Set<string>()
  private requestedAssets = new Set<string>()
  private ready = false
  private drag: { x: number; y: number; scrollX: number; scrollY: number; moved: boolean } | null = null
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

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.primaryDown || this.bridge.snapshot.blocked) return
      const camera = this.cameras.main
      this.drag = { x: pointer.x, y: pointer.y, scrollX: camera.scrollX, scrollY: camera.scrollY, moved: false }
    })
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.drag && pointer.isDown) {
        const dx = pointer.x - this.drag.x
        const dy = pointer.y - this.drag.y
        this.drag.moved ||= Math.hypot(dx, dy) > 8
        if (this.drag.moved) this.cameras.main.setScroll(this.drag.scrollX - dx / this.cameras.main.zoom, this.drag.scrollY - dy / this.cameras.main.zoom)
      }
      const slot = this.pickSlot(pointer)
      const hovered = this.drag?.moved ? null : slot?.id ?? null
      this.setHover(hovered)
      this.game.canvas.style.cursor = this.drag?.moved ? 'grabbing' : slot ? 'pointer' : 'grab'
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
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, _objects: unknown, _dx: number, dy: number) => {
      const event = pointer.event as WheelEvent
      // Keep the browser's Ctrl+wheel zoom available.
      if (event.ctrlKey || this.bridge.snapshot.blocked) return
      this.zoom(Math.exp(-dy * .001), pointer.x, pointer.y)
    })
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
    const camera = this.cameras.main
    if (command.type === 'zoom') this.zoom(command.factor)
    if (command.type === 'pan') camera.setScroll(camera.scrollX + command.x / camera.zoom, camera.scrollY + command.y / camera.zoom)
    if (command.type === 'reset-camera') this.resetCamera()
    if (command.type === 'focus-slot') {
      const slot = this.bridge.snapshot.model.slots.find(item => item.id === command.slot)
      this.focused = command.slot
      if (slot) {
        const point = camera.getWorldPoint(0, 0)
        const x = (slot.anchor.x - point.x) * camera.zoom
        const y = (slot.anchor.y - point.y) * camera.zoom
        if (x < 55 || x > camera.width - 55 || y < 150 || y > camera.height - 90) camera.centerOn(slot.anchor.x, slot.anchor.y)
      }
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
    if (model.kind === 'ground' && model.characteristics.groundDesigns.includes('beds')) needed.push(['empty-bed', BED_ART])
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
    this.painter.draw(model)
    this.painter.updateHorizon(this.cameras.main)
    this.drawEffects()
    this.bridge.emit({ type: 'rendered', components: [...this.painter.components] })
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
    const hitX = Math.max(profile.hitX, 22 / this.cameras.main.zoom)
    const hitY = Math.max(profile.hitY, 22 / this.cameras.main.zoom)
    return this.bridge.snapshot.model.slots
      .map(slot => ({ slot, distance: Math.hypot((point.x - slot.anchor.x) / hitX, (point.y - slot.anchor.y) / hitY) }))
      .filter(item => item.distance <= 1)
      .sort((a, b) => a.distance - b.distance)[0]?.slot
  }

  private zoom(factor: number, x = this.scale.width / 2, y = this.scale.height / 2) {
    const camera = this.cameras.main
    const before = camera.getWorldPoint(x, y)
    const minZoom = Math.max(this.scale.width / WORLD.width, this.scale.height / WORLD.height, .2)
    camera.setZoom(Phaser.Math.Clamp(camera.zoom * factor, minZoom, Math.max(minZoom, 1.8)))
    camera.preRender()
    const after = camera.getWorldPoint(x, y)
    camera.setScroll(camera.scrollX + before.x - after.x, camera.scrollY + before.y - after.y)
  }

  private resizeCamera() {
    // Phaser also emits RESIZE on a bounds refresh after page scrolling.
    // Preserve user pan/zoom unless the actual viewport dimensions changed.
    if (`${this.scale.width}:${this.scale.height}` !== this.viewportSize) this.resetCamera()
  }

  private resetCamera() {
    if (!this.ready) return
    this.viewportSize = `${this.scale.width}:${this.scale.height}`
    this.drag = null
    const minZoom = Math.max(this.scale.width / WORLD.width, this.scale.height / WORLD.height, .2)
    const zoom = Math.max(minZoom, Math.min(this.scale.width / 1750, this.scale.height / 1100, 1.3))
    this.cameras.main.setZoom(zoom).centerOn(WORLD.centerX, WORLD.centerY)
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
