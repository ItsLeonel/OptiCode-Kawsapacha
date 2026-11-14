import Phaser from 'phaser'
import { potArtwork } from '../pot-artwork'
import { PROP_FRAMES, SCENE_LAYERS, WORLD } from './assets'
import { REGION_STYLES } from './visual-config'
import { makeMaterials, paintFence, paintMeadow, paintPlot, paintStone, paintSupport, tintEarth, type Materials } from './paint-materials'
import type { GardenVisualModel, SlotId, VisualSlot } from './model'
import { POT_GEOMETRY, VERTICAL_GROUPS, HANGING_GROUPS, COASTAL_HANGING_GROUPS, hangingGeometry } from './layouts'
import { paintCourtyard } from './courtyard'
import { documentedGrowthStage } from '../growth-stages'
import { paintObservedPlant } from './plant-illustration'
import { paintCoastalOriginalBed, paintCoastalStandaloneRelief } from './coastal-bed'
import { coastalReliefFrame, coastalReliefGeometry, COASTAL_RELIEF_KEY, isCoastalRelief } from './coastal-terrain'
import { gardenFeaturePlacements } from './garden-feature-placements'
import type { ActivityType } from '../journal/activities'

type Layer = typeof SCENE_LAYERS[number]
type Node = Phaser.GameObjects.Image | Phaser.GameObjects.Graphics | Phaser.GameObjects.Text | Phaser.GameObjects.TileSprite
/** Independent semantic layers share depth sorting, so a front fence can occlude a planter. */
export class GardenScenePainter {
  private nodes = Object.fromEntries(SCENE_LAYERS.map(name => [name, new Set<Node>()])) as Record<Layer, Set<Node>>
  private masks = new Set<Phaser.Display.Masks.GeometryMask>()
  private horizon: Phaser.GameObjects.Image | null = null
  private generated = new Set<string>()
  private used = new Set<string>()
  private materials: Materials = {}
  private isCoast = false
  private regionalHorizonLift = .28
  components = new Set<string>()
  /** Last painter phase, retained so a thrown Phaser draw can be diagnosed. */
  lastRenderStage = 'idle'
  constructor(private scene: Phaser.Scene) {}

  private add<T extends Node>(layer: Layer, node: T, depth = 0): T {
    node.setDepth(layer === 'landscape' ? -100000 + depth : layer === 'ground' ? -50000 + depth : layer === 'effects' || layer === 'feedback' ? 100000 + depth : depth)
    node.setData('semanticLayer', layer)
    this.nodes[layer].add(node)
    return node
  }
  private graphics(layer: Layer, depth = 0) { return this.add(layer, this.scene.add.graphics(), depth) }
  private clear(layer: Layer) { this.nodes[layer].forEach(node => { this.scene.tweens.killTweensOf(node); node.destroy() }); this.nodes[layer].clear() }
  private optional(name: string, render: () => void) {
    this.lastRenderStage = `optional:${name}`
    try { render() }
    catch (error) { console.error(`[Kawsapacha][Phaser] optional render failed at ${this.lastRenderStage}`, error) }
  }
  private clearScene() { SCENE_LAYERS.forEach(layer => this.clear(layer)); this.masks.forEach(mask => mask.destroy()); this.masks.clear(); this.horizon = null }
  destroy() {
    this.clearScene()
    this.generated.forEach(key => this.scene.textures.remove(key))
    this.generated.clear()
  }

  private painted(layer: Layer, key: string, width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void, x = 0, y = 0, depth = 0) {
    const name = 'garden-art:' + key
    this.used.add(name)
    if (!this.scene.textures.exists(name)) {
      const texture = this.scene.textures.createCanvas(name, width, height)
      if (!texture) return null
      try {
        paint(texture.context)
        texture.refresh()
      } catch (error) {
        // Never leave a partially painted CanvasTexture under a reusable key.
        this.scene.textures.remove(name)
        throw error
      }
      this.generated.add(name)
    }
    return this.add(layer, this.scene.add.image(x, y, name).setOrigin(0), depth)
  }

  updateHorizon(camera: Phaser.Cameras.Scene2D.Camera) {
    const origin = camera.getWorldPoint(0, 0)
    const width = camera.width / camera.zoom
    const height = camera.height / camera.zoom
    if (!this.horizon) return
    const image = this.horizon.texture.getSourceImage() as HTMLImageElement
    // For the regional scenes the horizon AND the cultivable soil belong to
    // one illustration. Cover the camera view without stretching the source.
    // Costa retains its previously approved cinematic framing.
    const scale = this.isCoast
      ? Math.max(width * 1.12 / image.width, height * 1.08 / image.height)
      : Math.max(width * 1.04 / image.width, height * 1.04 / image.height)
    const displayWidth = image.width * scale
    const displayHeight = image.height * scale
    const horizonTop = this.isCoast
      ? origin.y - height * .22
      : origin.y - (displayHeight - height) * this.regionalHorizonLift
    this.horizon.setPosition(origin.x - (displayWidth - width) / 2, horizonTop)
      .setDisplaySize(displayWidth, displayHeight)
  }

  registerFrames() {
    for (const key of ['garden-supplies', 'garden-infrastructure']) if (this.scene.textures.exists(key)) {
      const texture = this.scene.textures.get(key)
      for (let index = 0; index < 6; index++) if (!texture.has('item-' + index)) texture.add('item-' + index, 0, index % 3 * 512, Math.floor(index / 3) * 512, 512, 512)
    }
    if (this.scene.textures.exists('ground-materials')) {
      const texture = this.scene.textures.get('ground-materials')
      const source = texture.getSourceImage() as HTMLImageElement
      const width = Math.floor(source.width / 2)
      const height = Math.floor(source.height / 2)
      ;['grass', 'soil', 'stone', 'volcanic'].forEach((name, index) => { if (!texture.has(name)) texture.add(name, 0, index % 2 * width, Math.floor(index / 2) * height, width, height) })
    }
    if (this.scene.textures.exists('modular-props')) {
      const texture = this.scene.textures.get('modular-props')
      Object.entries(PROP_FRAMES).forEach(([name, [x, y, width, height]]) => {
        if (!texture.has(name)) texture.add(name, 0, x, y, width, height)
      })
    }
    if (this.scene.textures.exists('empty-pots')) {
      const texture = this.scene.textures.get('empty-pots')
      for (let index = 0; index < 6; index++) if (!texture.has(`pot-${index}`)) texture.add(`pot-${index}`, 0, index % 3 * 512, Math.floor(index / 3) * 512, 512, 512)
    }
    for (const region of ['sierra', 'costa', 'oriente', 'galapagos'] as const) {
      for (const kind of ['pots', 'baskets'] as const) {
        const key = `regional-${kind}-${region}`
        if (!this.scene.textures.exists(key)) continue
        const texture = this.scene.textures.get(key)
        for (let index = 0; index < 6; index++) {
          const frame = `item-${index}`
          if (!texture.has(frame)) texture.add(frame, 0, (index % 3) * 512, Math.floor(index / 3) * 512, 512, 512)
        }
      }
    }
    if (this.scene.textures.exists('regional-borders')) {
      const texture = this.scene.textures.get('regional-borders')
      for (let index = 0; index < 4; index++) if (!texture.has(`border-${index}`)) texture.add(`border-${index}`, 0, index % 2 * 768, Math.floor(index / 2) * 512, 768, 512)
    }
    if (this.scene.textures.exists('empty-trough') && !this.scene.textures.get('empty-trough').has('tray')) this.scene.textures.get('empty-trough').add('tray', 0, 0, 180, 1536, 650)
  }

  draw(model: GardenVisualModel) {
    this.lastRenderStage = 'clear-scene'
    this.clearScene()
    this.used.clear()
    this.components.clear()
    this.lastRenderStage = 'material-atlas'
    if (!this.materials.grass && this.scene.textures.exists('ground-materials')) this.materials = makeMaterials(this.scene.textures.get('ground-materials').getSourceImage() as HTMLImageElement)
    this.registerFrames()
    this.lastRenderStage = `environment:${model.region}`
    this.isCoast = model.region === 'costa'
    this.regionalHorizonLift = model.kind === 'ground' ? .28 : .38
    this.environment(model)
    this.lastRenderStage = `floor:${model.region}`
    this.floor(model)
    // All six slots render their own approved bed or independent soil relief.
    for (const slot of model.slots) {
      this.lastRenderStage = `slot:${slot.id}`
      this.slot(model, slot)
    }
    if (model.region !== 'costa' && model.kind === 'ground') this.components.add(`terrain:integrated:${model.region}`)
    // Optional props cannot block the core lawn or any of the six crop slots.
    this.optional('regional-decoration', () => this.regionalDecoration(model))
    this.optional(`supports:${model.kind}`, () => this.supports(model))
    this.optional('fences', () => this.fences(model))
    this.optional('water', () => this.water(model))
    this.optional('irrigation', () => this.irrigation(model))
    this.optional('fertilizers', () => this.fertilizers(model))
    this.lastRenderStage = 'texture-cleanup'
    // Keep only the current art configuration, including after province/kind changes.
    for (const key of this.generated) if (!this.used.has(key)) { this.scene.textures.remove(key); this.generated.delete(key) }
    this.components.add('art:phase-1')
    this.components.add('perspective:oblique')
    this.components.add('light:upper-left')
    this.lastRenderStage = 'complete'
  }



  private prop(name: keyof typeof PROP_FRAMES, x: number, y: number, width: number, height?: number, depth = y * 10) {
    this.components.add('prop:' + name)
    const g = this.graphics('ground', y)
    g.fillStyle(0x27331b, .23).fillEllipse(x + width * .03, y + 5, width * .82, width * .12)
    if (this.scene.textures.exists('modular-props')) {
      const frame = PROP_FRAMES[name]
      return this.add('structures', this.scene.add.image(x, y, 'modular-props', name).setOrigin(.5, .98).setDisplaySize(width, height ?? width * frame[3] / frame[2]), depth)
    }
    // Asset failure preserves the structure silhouette and every interactive control.
    const fallback = this.graphics('structures', depth)
    fallback.fillStyle(0xb88c54).fillRoundedRect(x - width / 2, y - (height ?? width * .7), width, height ?? width * .7, 10)
    return null
  }

  private environment(model: GardenVisualModel) {
    const style = REGION_STYLES[model.region]
    this.graphics('landscape').fillStyle(style.sky).fillRect(0, 0, WORLD.width, WORLD.height)
    const key = 'landscape-' + model.region
    if (this.scene.textures.exists(key)) {
      this.horizon = this.add('landscape', this.scene.add.image(0, 0, key).setOrigin(0), 1)
    } else this.painted('landscape', 'meadow-' + model.region, WORLD.width, WORLD.height, ctx => paintMeadow(ctx, model, this.materials), 0, 0, -1)
    this.components.add('region:' + model.region)
    this.components.add('environment:' + model.region)
  }

  private regionalDecoration(model: GardenVisualModel) {
    // The new regional source paintings already contain their own rocks,
    // vegetation and foreground. Duplicating PNG borders made objects float.
    if (model.region !== 'costa' || !this.scene.textures.exists('regional-borders')) return
    for (const [x, y, width, flip] of [[150, 1120, 280, 0], [1770, 1080, 280, 1]] as const) {
      this.add('structures', this.scene.add.image(x, y, 'regional-borders', 'border-1')
        .setOrigin(.5, .9).setDisplaySize(width, width * 2 / 3).setFlipX(Boolean(flip)), y * 10)
    }
  }

  private floor(model: GardenVisualModel) {
    // Keep Costa's keys intact. Regional floors depend on modality and area,
    // so a cached container meadow cannot replace the level ground layout.
    const floorKey = model.region === 'costa' && model.kind === 'ground'
      ? `courtyard-costa-area-v7-${Math.round(model.footprintScale * 1000)}`
      : model.region === 'costa' ? 'courtyard-costa-integrated-v6'
      : `courtyard-${model.region}-${model.kind}-integrated-v4-${Math.round(model.footprintScale * 1000)}-${JSON.stringify(model.characteristics)}`
    try {
      const surface = this.painted('ground', floorKey, WORLD.width, WORLD.height, ctx => paintCourtyard(ctx, model, this.materials))
      if (!surface) throw new Error(`Phaser no pudo crear la CanvasTexture del terreno (${floorKey}).`)

    } catch (error) {
      console.error(`[Kawsapacha][Phaser] floor texture failed at floor:${model.region}`, error)
      if (model.region !== 'costa') throw error
      // Canvas failure still leaves a visible, flat coastal surface beneath plots.
      this.graphics('ground').fillStyle(0x8fb94b).fillRect(0, 700, WORLD.width, WORLD.height - 700)
    }
    this.components.add('surface:continuous')
    this.components.add('path:natural-stone')
  }


  private supports(model: GardenVisualModel) {
    if (model.kind !== 'vertical' && model.kind !== 'hanging') return
    const regional = `regional-${model.kind}-${model.region}`
    if (this.scene.textures.exists(regional)) {
      // Each modality uses one coherent, anchored regional structure behind six slots.
      const shadow = this.graphics('ground', 850)
      shadow.fillStyle(0x152619, .14).fillEllipse(1030, 1228, 1110, 88)
      this.add('structures', this.scene.add.image(330, 400, regional)
        .setOrigin(0).setDisplaySize(1400, 900), 5800)
      this.components.add(`support:regional:${model.region}:${model.kind}`)
      this.components.add(model.kind === 'vertical' ? 'support:anchored-frame' : 'support:grounded-pergola')
      return
    }
    // The original game atlas remains a safe fallback if a regional image fails.
    const key = model.kind === 'vertical' ? 'garden-trellis' : 'garden-pergola'
    const groups = model.kind === 'vertical' ? VERTICAL_GROUPS : model.region === 'costa' ? COASTAL_HANGING_GROUPS : HANGING_GROUPS
    for (const group of groups) {
      if (this.scene.textures.exists(key)) {
        const source = this.scene.textures.get(key).getSourceImage() as HTMLImageElement
        this.add('structures', this.scene.add.image(group.x, group.y, key).setOrigin(.5, .96).setScale(group.width / source.width), group.y * 10 - 400)
        const shadow = this.graphics('ground', 3)
        shadow.fillStyle(0x293b22, .15).fillEllipse(group.x + 14, group.y, group.width * .9, 38)
      } else this.painted('structures', `support-${model.kind}-${model.region}`, 1340, 970, ctx => paintSupport(ctx, model), group.x - group.width / 2, group.y - group.width * .65, group.y * 10 - 400)?.setScale(group.width / 1340)
    }
    this.components.add(model.kind === 'vertical' ? 'support:anchored-frame' : 'support:grounded-pergola')
  }

  private fences(model: GardenVisualModel) {
    const kinds = model.characteristics.fences
    if (!kinds.length) return
    if (model.region === 'costa') {
      this.coastalFences(model, kinds)
      return
    }
    this.regionalFences(model, kinds)
  }

  private regionalFences(model: GardenVisualModel, kinds: GardenVisualModel['characteristics']['fences']) {
    // Each regional painting has different clearings, houses and coastlines.
    // Fence accents therefore follow calibrated per-region placements instead
    // of reusing a single generic position for every background.
    const placements = gardenFeaturePlacements(model.region, model.kind)
    const segments = placements?.fences?.length
      ? placements.fences
      : (model.kind === 'ground'
        ? [{ x: 395, y: 798, length: 176, thickness: 68 }, { x: 1515, y: 793, length: 176, thickness: 68 }]
        : [{ x: 400, y: 812, length: 176, thickness: 64 }, { x: 1510, y: 807, length: 176, thickness: 64 }])
    const selected = [...new Set(kinds)]
    if (!selected.length) return
    const total = segments.length
    segments.forEach((segment, index) => {
      const kind = selected[Math.min(selected.length - 1, Math.floor(index * selected.length / total))]
      const point = { x: segment.x, y: segment.y }
      // Keep the regional fence arrangement, but give each section the
      // presence of a practical garden boundary rather than a tiny prop.
      const fenceWidth = Math.round(segment.length * 1.28)
      const fenceHeight = Math.round(segment.thickness * 1.18)
      const side = point.x < WORLD.centerX ? 1 : -1
      if (kind === 'living') {
        const hedge = this.graphics('structures', point.y * 10)
        const count = Math.max(8, Math.round(fenceWidth / 16))
        const startX = point.x - fenceWidth / 2 + 12
        for (let j = 0; j < count; j++) {
          const px = startX + j * ((fenceWidth - 24) / Math.max(1, count - 1))
          const fluctuation = Math.sin((j + 2) * 1.7) * 5
          hedge.fillStyle(model.region === 'galapagos' ? 0x657145 : model.region === 'oriente' ? 0x3c7239 : 0x64853c, .84)
          hedge.fillEllipse(px, point.y - 4 + fluctuation, 24 + (j % 3) * 6, 11 + (j % 4) * 3)
          hedge.fillStyle(0xc3ca73, .32)
          hedge.fillEllipse(px - 3, point.y - 11 + fluctuation, 13, 5)
        }
      } else if (kind === 'natural' && this.scene.textures.exists('modular-props')) {
        const prop = this.prop('fence', point.x + side * 8, point.y + 10, Math.max(160, fenceWidth), undefined, point.y * 10)
        prop?.setFlipX(point.x > WORLD.centerX)
      } else if (this.scene.textures.exists('garden-infrastructure')) {
        const frame = ({ recycled: 1, metal: 2, conventional: 3, natural: 1 } as const)[kind]
        this.add('structures', this.scene.add.image(point.x, point.y + 10,
          'garden-infrastructure', 'item-' + frame).setOrigin(.5, .86).setDisplaySize(Math.max(150, fenceWidth * .9), Math.max(145, fenceHeight * 1.9)), point.y * 10)
      } else {
        this.painted('structures', `fence-regional-${model.region}-${kind}-${index}`, 255, 190,
          ctx => paintFence(ctx, kind, index), point.x - 90, point.y - 128, point.y * 10)?.setDisplaySize(Math.max(185, fenceWidth), Math.max(145, fenceHeight * 1.8))
      }
      this.components.add(`fence:${kind}`)
    })
    this.components.add(`fence:perimeter:${model.region}`)
  }

  private coastalFences(model: GardenVisualModel, kinds: GardenVisualModel['characteristics']['fences']) {
    // Keep the already-calibrated coastal arrangement for the other modalities.
    if (model.kind !== 'ground') {
    let index = 0
    const meshTypes = kinds.filter(kind => kind === 'metal' || kind === 'conventional')
    const part = (x: number, y: number, width: number, rotation = 0) => {
      const kind = kinds[index++ % kinds.length]
      const key = kind === 'living' ? 'costa-fence-flora' : kind === 'metal' || kind === 'conventional' ? 'costa-fence-segment' : null
      if (key && this.scene.textures.exists(key)) {
        const source = this.scene.textures.get(key).getSourceImage() as HTMLImageElement
        const height = width * source.height / source.width
        this.add('structures', this.scene.add.image(x, y, key).setOrigin(.5).setDisplaySize(width, height * (y < 900 ? .69 : .92)).setRotation(rotation).setAlpha(y < 900 ? .93 : 1), y * 10)
        this.components.add(`fence:${kind}:costa-png`)
      } else if (kind === 'natural' && this.scene.textures.exists('modular-props')) {
        this.prop('fence', x, y, Math.min(width, 350), undefined, y * 10)?.setFlipX(x > WORLD.centerX)
        this.components.add(`fence:${kind}`)
      } else if (kind !== 'natural' && this.scene.textures.exists('garden-infrastructure')) {
        const frame = { living: 0, recycled: 1, metal: 2, conventional: 3 }[kind]
        this.add('structures', this.scene.add.image(x, y, 'garden-infrastructure', 'item-' + frame).setOrigin(.5, .9).setDisplaySize(Math.min(width, 240), 240), y * 10)
        this.components.add(`fence:${kind}`)
      } else {
        this.painted('structures', `fence-${kind}-costa-${index}`, 255, 190, ctx => paintFence(ctx, kind, index), x - width / 2, y - 155, y * 10)
        this.components.add(`fence:${kind}:fallback`)
      }
    }

    // Keep the recorded enclosure, but place the rear line immediately at the
    // grass boundary. A low fence no longer creates a wall across the sea.
    for (const x of [200, 580, 960, 1340, 1720]) part(x, 700, 345)
    // Only the outer foreground segments frame the entrance. The central lawn,
    // all six plots and the floating action bar remain unobstructed.
    part(365, 1192, 330)
    part(1555, 1192, 330)
    // The registered fence remains present on the rear and foreground edges;
    // no decorative or unregistered replacement type is introduced.
    if (meshTypes.length) {
      const gateKey = 'costa-fence-gate'
      if (this.scene.textures.exists(gateKey)) {
        const source = this.scene.textures.get(gateKey).getSourceImage() as HTMLImageElement
        const width = 315
        this.add('structures', this.scene.add.image(WORLD.width / 2, 1228, gateKey).setOrigin(.5, 1).setDisplaySize(width, width * source.height / source.width), 12282)
        this.components.add(`fence:${meshTypes[0]}:costa-gate`)
      }
    }
    this.components.add(`fence:perimeter:${model.region}`)
      return
    }

    const placements = gardenFeaturePlacements(model.region, model.kind)
    if (!placements) return
    const selected = [...new Set(kinds)]
    if (!selected.length) return
    const total = placements.fences.length
    placements.fences.forEach((segment, index) => {
      // Each selected fence occupies one continuous run around the enclosure.
      const kind = selected[Math.min(selected.length - 1, Math.floor(index * selected.length / total))]
      const depth = segment.y * 10
      let texture: string | null = null
      let frame: string | undefined
      if (model.region === 'costa' && kind === 'living' && this.scene.textures.exists('costa-fence-flora')) texture = 'costa-fence-flora'
      else if (model.region === 'costa' && kind === 'metal' && this.scene.textures.exists('costa-fence-segment')) texture = 'costa-fence-segment'
      else if (kind === 'natural' && this.scene.textures.exists('modular-props')) { texture = 'modular-props'; frame = 'fence' }
      else if (this.scene.textures.exists('garden-infrastructure')) {
        texture = 'garden-infrastructure'
        frame = ({ living: 'item-0', natural: 'item-1', recycled: 'item-3', metal: 'item-2', conventional: 'item-1' } as const)[kind]
      }

      if (texture) {
        const image = this.scene.add.image(segment.x, segment.y, texture, frame)
          .setOrigin(.5, .5)
          .setDisplaySize(segment.length, segment.thickness)
          .setRotation(segment.rotation ?? 0)
        this.add('structures', image, depth)
        this.components.add(`fence:${kind}:${model.region}-art`)
      } else {
        const fallback = this.painted('structures', `fence-${model.region}-ground-${kind}-${index}`, 360, 150,
          ctx => paintFence(ctx, kind, index % 3), segment.x - segment.length / 2, segment.y - segment.thickness * .82, depth)
        fallback?.setOrigin(.5, .82).setPosition(segment.x, segment.y).setRotation(segment.rotation ?? 0)
        if (model.region !== 'costa') fallback?.setDisplaySize(segment.length, segment.thickness)
        this.components.add(`fence:${kind}:${model.region}-fallback`)
      }
    })
    this.components.add(`fence:perimeter:${model.region}`)
  }

  private regionalServiceBase(model: GardenVisualModel, x: number, y: number, width: number) {
    if (model.region !== 'costa') {
      // A shallow earth-coloured contact shadow, NOT a stone pedestal.
      // The previous broad grey rings were visibly detached from the props.
      const earth = {
        sierra: 0x786e50,
        oriente: 0x3e4d2f,
        galapagos: 0x594b40,
      }[model.region]
      const contact = this.graphics('ground', y)
      contact.fillStyle(0x111c14, .19).fillEllipse(x + 3, y + 4, width * .72, width * .14)
      contact.fillStyle(earth, .15).fillEllipse(x, y + 2, width * .88, width * .12)
      return
    }
    if (model.kind === 'ground') return // Costa ground keeps its approved appearance.
    const material = {
      sierra: { base: 0xb7b09a, edge: 0x6d6457, highlight: 0xe0d5bc },
      costa: { base: 0xcaa56f, edge: 0x7a5934, highlight: 0xebcf94 },
      oriente: { base: 0x8b7d5c, edge: 0x4c5639, highlight: 0xcabf93 },
      galapagos: { base: 0x908b84, edge: 0x4c4a49, highlight: 0xcbbca5 },
    }[model.region]
    const stage = this.graphics('ground', y)
    // Low-profile service patch seated on the terrain; avoids the old floating pedestal look.
    stage.fillStyle(0x16261a, .14).fillEllipse(x + 8, y + 18, width * 1.04, width * .18)
    stage.fillStyle(material.edge, .78).fillEllipse(x, y + 10, width * .94, width * .16)
    stage.fillStyle(material.base, .94).fillEllipse(x, y + 6, width * .88, width * .12)
    stage.lineStyle(2, material.highlight, .75).strokeEllipse(x, y + 4, width * .82, width * .10)
    if (model.region === 'costa') {
      for (const dx of [-.26, 0, .26]) {
        stage.lineStyle(4, 0xe3c98d, .75).lineBetween(x + width * dx, y - width * .02, x + width * dx, y + width * .07)
      }
    }
    // Las otras regiones ya retornan al comienzo del método; esta sección solo dibuja Costa.
  }

  private water(model: GardenVisualModel) {
    const placements = gardenFeaturePlacements(model.region, model.kind)
    if (placements) {
      const tint = model.irrigationAvailability === 'unavailable' ? 0xaeb5b0 : model.irrigationAvailability === 'seasonal' ? 0xe6d9bf : 0xffffff
      this.components.add(`availability:${model.irrigationAvailability}`)
      model.characteristics.waterSources.forEach(source => {
        const point = placements.waterSources[source]
        if (source === 'channel') {
          const { x, y, width, height } = placements.channel
          this.painted('ground', `channel-${model.region}-surface-v1`, width, height, ctx => {
            const stream = new Path2D(`M 20 ${height * .56} C ${width * .22} ${height * .12}, ${width * .38} ${height * .88}, ${width * .56} ${height * .53} S ${width * .82} ${height * .16}, ${width - 20} ${height * .56}`)
            ctx.lineCap = 'round'; ctx.lineJoin = 'round'
            ctx.strokeStyle = '#344235'; ctx.lineWidth = 36; ctx.stroke(stream)
            ctx.strokeStyle = '#92754e'; ctx.lineWidth = 30; ctx.stroke(stream)
            ctx.strokeStyle = '#238da9'; ctx.lineWidth = 24; ctx.stroke(stream)
            ctx.strokeStyle = '#54c4d4'; ctx.lineWidth = 17; ctx.stroke(stream)
            ctx.strokeStyle = '#d3f0dcbb'; ctx.lineWidth = 2
            const glint = new Path2D(`M ${width * .2} ${height * .55} Q ${width * .32} ${height * .39}, ${width * .43} ${height * .5} M ${width * .59} ${height * .48} Q ${width * .71} ${height * .35}, ${width * .8} ${height * .48}`)
            ctx.stroke(glint)
            for (const [px, py, rx, ry] of [[42, 12, 7, 4], [76, height - 10, 8, 4], [width - 76, 12, 7, 4], [width - 42, height - 10, 8, 4]] as const) {
              ctx.fillStyle = '#b6a077'
              ctx.beginPath(); ctx.ellipse(px, py, rx, ry, -.18, 0, Math.PI * 2); ctx.fill()
            }
          }, x, y, y * 10)
          this.components.add('water:channel:visible-surface')
        } else if (source === 'rain') {
          const { x, y } = placements.rain
          const plaque = this.graphics('structures', y * 10)
          plaque.fillStyle(0x765130).fillRoundedRect(x - 69, y - 24, 10, 36, 3).fillRoundedRect(x + 59, y - 24, 10, 36, 3)
          plaque.fillStyle(0x243627, .24).fillRoundedRect(x - 97, y - 67, 194, 54, 9)
          plaque.fillStyle(0x8b5c30).fillRoundedRect(x - 96, y - 72, 192, 54, 9)
          plaque.fillStyle(0xf3e5bb).fillRoundedRect(x - 91, y - 67, 182, 44, 7)
          plaque.lineStyle(2, 0xc9984f).strokeRoundedRect(x - 91, y - 67, 182, 44, 7)
          plaque.fillStyle(0x5e9eb3).fillCircle(x - 65, y - 46, 13).fillCircle(x - 51, y - 52, 16).fillCircle(x - 35, y - 45, 12)
          plaque.fillStyle(0x4b91a6).fillTriangle(x - 70, y - 42, x - 60, y - 42, x - 65, y - 30)
          this.add('structures', this.scene.add.text(x - 22, y - 58, 'Lluvia', { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#34543a' }).setOrigin(0, .5), y * 10 + 1)
          this.add('structures', this.scene.add.text(x - 22, y - 38, 'Fuente declarada', { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '10px', color: '#52634a' }).setOrigin(0, .5), y * 10 + 1)
          this.components.add('water:rain:declared-indicator')
        } else if (point && source === 'stored') {
          this.regionalServiceBase(model, point.x, point.y, 236)
          this.prop('tank', point.x, point.y, model.kind === 'ground' ? 170 : 260)?.setTint(tint)
          this.components.add('water:stored')
        } else if (point && (source === 'mains' || source === 'well') && this.scene.textures.exists('garden-infrastructure')) {
          this.regionalServiceBase(model, point.x, point.y, 245)
          const frame = source === 'well' ? 'item-4' : 'item-5'
          this.add('structures', this.scene.add.image(point.x, point.y, 'garden-infrastructure', frame)
            // Native atlas artwork ends at y≈416/512 (well) or 459/512 (tap).
            // Anchor the visible bottom to the actual ground contact point.
            .setOrigin(.5, model.region === 'costa' ? .88 : source === 'well' ? .813 : .897)
            .setDisplaySize(model.kind === 'ground' ? 178 : 260, model.kind === 'ground' ? 178 : 260)
            .setTint(tint), point.y * 10)
          this.components.add(`water:${source}`)
        } else if (point && (source === 'well' || source === 'mains')) {
          this.regionalServiceBase(model, point.x, point.y, 245)
          const g = this.graphics('structures', point.y * 10)
          if (source === 'well') {
            g.fillStyle(0x575a48).fillEllipse(point.x, point.y - 54, 132, 62)
            g.fillStyle(0xb4a786).fillRoundedRect(point.x - 66, point.y - 62, 132, 60, 11)
            g.fillStyle(0x403d2a).fillEllipse(point.x, point.y - 65, 94, 36)
            g.lineStyle(8, 0xd0c4a0).strokeEllipse(point.x, point.y - 65, 124, 54)
          } else {
            g.lineStyle(19, 0x78857c).lineBetween(point.x, point.y, point.x, point.y - 96).lineBetween(point.x, point.y - 96, point.x + 43, point.y - 96)
            g.lineStyle(6, 0xd3cbb6).lineBetween(point.x - 4, point.y - 10, point.x - 4, point.y - 96)
            g.fillStyle(0xc19b49).fillRoundedRect(point.x + 24, point.y - 106, 38, 18, 5)
          }
          this.components.add(`water:${source}:fallback`)
        } else if (source === 'other') {
          // The registered value remains available in the terrain details; no structure is inferred.
          this.components.add('water:other:informational')
        }
      })
      return
    }
    // Muted hardware for a declared lack of water; no fill level or flow is inferred.
    const tint = model.irrigationAvailability === 'unavailable' ? 0xaeb5b0 : model.irrigationAvailability === 'seasonal' ? 0xe6d9bf : 0xffffff
    this.components.add(`availability:${model.irrigationAvailability}`)
    model.characteristics.waterSources.forEach((source, index) => {
      const coastal = model.region === 'costa'
      const x = (coastal ? 1735 : 1700) + index % 2 * (coastal ? 100 : 125)
      const y = (coastal ? 870 : 800) + Math.floor(index / 2) * (coastal ? 155 : 190)
      const g = this.graphics('structures', y * 10)
      // Rain records a natural source; it does not register a storage installation.
      if (source === 'stored') this.prop('tank', x, y, coastal ? 165 : 195)?.setTint(tint)
      if ((source === 'mains' || source === 'well') && this.scene.textures.exists('garden-infrastructure')) {
        this.add('structures', this.scene.add.image(x, y, 'garden-infrastructure', source === 'well' ? 'item-4' : 'item-5').setOrigin(.5, .88).setDisplaySize(190, 190).setTint(tint), y * 10)
      } else if (source === 'mains') {
        g.lineStyle(22, 0x78857c).lineBetween(x, y, x, y - 145).lineBetween(x, y - 145, x + 65, y - 145)
        g.lineStyle(6, 0xd3cbb6).lineBetween(x - 5, y - 8, x - 5, y - 145)
        g.fillStyle(0xc19b49).fillRoundedRect(x + 30, y - 152, 55, 24, 4)
        g.lineStyle(5, 0x687b56).lineBetween(x + 50, y - 165, x + 50, y - 140)
      }
      if (source === 'well' && !this.scene.textures.exists('garden-infrastructure')) {
        g.fillStyle(0x575a48).fillEllipse(x, y - 45, 150, 75)
        g.fillStyle(0xb4a786).fillRoundedRect(x - 75, y - 45, 150, 50, 10)
        g.fillStyle(0x403d2a).fillEllipse(x, y - 48, 110, 40)
        g.lineStyle(8, 0xd0c4a0).strokeEllipse(x, y - 48, 140, 60)
      }
      if (source === 'channel') {
        this.painted('ground', 'channel-' + model.region, 190, 210, ctx => {
          const path = new Path2D('M 88 12 C 62 58 128 112 102 188')
          ctx.lineCap = 'round'; ctx.strokeStyle = '#34403750'; ctx.lineWidth = 80; ctx.stroke(path)
          ctx.strokeStyle = '#7e7051'; ctx.lineWidth = 62; ctx.stroke(path)
          ctx.strokeStyle = '#4b422f'; ctx.lineWidth = 34; ctx.stroke(path)
          for (let index = 0; index < 9; index++) {
            const center = 88 + Math.sin(index * .6) * 13
            for (const side of [-1, 1]) paintStone(ctx, center + side * 32, 16 + index * 21, 25, 15, index + side + 20, model.region === 'galapagos')
          }
        }, x - 95, y - 190, y)
      }
      this.components.add(`water:${source}`)
    })
  }

  private supply(frame: number, x: number, y: number, width: number, depth = y * 10, grounded = false) {
    if (!this.scene.textures.exists('garden-supplies')) return false
    const contact = this.graphics('ground', y)
    contact.fillStyle(0x1f2a1d, grounded ? .23 : .18)
      .fillEllipse(x + 3, y + (grounded ? 3 : 8), width * (grounded ? .66 : .55), width * .12)
    // Calibrated to the visible bottom of each 512px atlas frame. In particular
    // the hose ends at 415px: using .86 left a large gap above its ground shadow.
    const visibleBottom = [.748, .768, .777, .832, .811, .844] as const
    this.add('structures', this.scene.add.image(x, y, 'garden-supplies', 'item-' + frame)
      .setOrigin(.5, grounded ? visibleBottom[frame] ?? .8 : frame < 3 ? .76 : .86)
      .setDisplaySize(width, width), depth)
    return true
  }

  private irrigation(model: GardenVisualModel) {
    const placements = gardenFeaturePlacements(model.region, model.kind)
    if (placements) {
      model.characteristics.irrigationMethods.forEach(method => {
        if (method === 'drip') {
          const point = placements.irrigation.drip
          if (model.kind === 'ground' && point && model.region !== 'costa') {
            const kit = this.graphics('structures', point.y * 10 + 1500)
            kit.fillStyle(0x263b28, .18).fillEllipse(point.x + 2, point.y + 8, 116, 26)
            kit.lineStyle(11, 0x24483a, .98).strokeEllipse(point.x - 9, point.y - 7, 76, 42)
            kit.lineStyle(5, 0x79a36d, .96).strokeEllipse(point.x - 9, point.y - 8, 68, 34)
            kit.lineStyle(8, 0x24483a, .98).lineBetween(point.x + 27, point.y - 12, point.x + 52, point.y - 12)
            kit.lineStyle(4, 0x9da88a).lineBetween(point.x + 43, point.y - 16, point.x + 43, point.y - 6)
            kit.fillStyle(0x8eb6a2).fillTriangle(point.x + 40, point.y + 5, point.x + 48, point.y + 5, point.x + 44, point.y + 14)
            this.components.add('irrigation:drip:side-kit')
          } else if (model.region === 'costa' && model.kind === 'ground' && point) {
            const kit = this.graphics('structures', point.y * 10 + 1500)
            kit.fillStyle(0x263b28, .18).fillEllipse(point.x + 2, point.y + 8, 116, 26)
            kit.lineStyle(11, 0x24483a, .98).strokeEllipse(point.x - 9, point.y - 7, 76, 42)
            kit.lineStyle(5, 0x79a36d, .96).strokeEllipse(point.x - 9, point.y - 8, 68, 34)
            kit.lineStyle(8, 0x24483a, .98).lineBetween(point.x + 27, point.y - 12, point.x + 52, point.y - 12)
            kit.lineStyle(4, 0x9da88a).lineBetween(point.x + 43, point.y - 16, point.x + 43, point.y - 6)
            kit.fillStyle(0x8eb6a2).fillTriangle(point.x + 40, point.y + 5, point.x + 48, point.y + 5, point.x + 44, point.y + 14)
            this.components.add('irrigation:drip:side-kit')
          } else {
            if (point && model.kind !== 'ground') {
              this.regionalServiceBase(model, point.x, point.y, 160)
              this.supply(4, point.x, point.y, 198, point.y * 10 + 1500, model.region !== 'costa')
            }
            for (const slot of model.slots) {
            const pipe = this.graphics('parcels', slot.depth * 10 + 3)
            if (model.kind === 'ground') {
              // Scale the laterals with the new coastal footprint so they stay
              // over the soil opening on 10, 50 and 100 m² layouts.
              const scale = model.footprintScale
              const half = 100 * scale
              const offset = 34 * scale
              pipe.lineStyle(4 * scale, 0x263e31, .96).lineBetween(slot.anchor.x - half, slot.anchor.y + offset + half * .115, slot.anchor.x + half, slot.anchor.y + offset - half * .115)
              pipe.lineStyle(1.2 * scale, 0xa4b394, .7).lineBetween(slot.anchor.x - half, slot.anchor.y + offset + half * .115 - 1, slot.anchor.x + half, slot.anchor.y + offset - half * .115 - 1)
              for (const emitter of [-.6, 0, .6]) pipe.fillStyle(0x6b9970).fillCircle(slot.anchor.x + half * emitter, slot.anchor.y + offset - half * emitter * .115, 3.2 * scale)
            } else {
              // Containers get local emitters only; no long line floats between them.
              const half = model.kind === 'vertical' ? 38 : 24
              pipe.lineStyle(3, 0x263e31, .95).lineBetween(slot.anchor.x - half, slot.anchor.y + 3, slot.anchor.x + half, slot.anchor.y + 3)
              pipe.lineStyle(1, 0xa4b394, .65).lineBetween(slot.anchor.x - half, slot.anchor.y + 1, slot.anchor.x + half, slot.anchor.y + 1)
              pipe.fillStyle(0x6b9970).fillCircle(slot.anchor.x, slot.anchor.y + 3, 3)
            }
            }
          }
        } else {
          const point = placements.irrigation[method]
          if (point && (method === 'manual' || method === 'hose' || method === 'sprinkler')) {
            const frame = ({ manual: 3, hose: 4, sprinkler: 5 } as const)[method]
            this.regionalServiceBase(model, point.x, point.y, 158)
            if (!this.supply(frame, point.x, point.y, model.kind === 'ground' ? 142 : 216, point.y * 10 + 1500, model.region !== 'costa')) {
              const fallback = this.graphics('structures', point.y * 10)
              fallback.fillStyle(0x6f8f66).fillEllipse(point.x, point.y - 20, 68, 36)
            }
          }
        }
        // The sprinkler remains static until a recorded irrigation activity is performed.
        this.components.add(`irrigation:${method}`)
      })
      return
    }
    model.characteristics.irrigationMethods.forEach((method, index) => {
      const x = 340 + index * 100
      const y = 1100
      if (method === 'drip') {
        for (const slot of model.slots) {
          // Each line rests on its actual soil opening, including suspended containers.
          const pipe = this.graphics('parcels', slot.depth * 10 + 3)
          const half = model.kind === 'ground' ? 100 : model.kind === 'vertical' ? 95 : 65
          const offset = model.kind === 'ground' ? 34 : 4
          pipe.lineStyle(4, 0x263e31, .9).lineBetween(slot.anchor.x - half, slot.anchor.y + offset + half * .115, slot.anchor.x + half, slot.anchor.y + offset - half * .115)
          pipe.lineStyle(1, 0xa4b394, .55).lineBetween(slot.anchor.x - half, slot.anchor.y + offset + half * .115 - 1, slot.anchor.x + half, slot.anchor.y + offset - half * .115 - 1)
          for (const emitter of [-.6, 0, .6]) pipe.fillStyle(0x647b61).fillCircle(slot.anchor.x + half * emitter, slot.anchor.y + offset - half * emitter * .115, 3)
        }
      } else if (method !== 'other') {
        const frame = { manual: 3, hose: 4, sprinkler: 5 }[method]
        if (!this.supply(frame, x, y, 150)) {
          const fallback = this.graphics('structures', y * 10)
          fallback.fillStyle(0x6f8f66).fillEllipse(x, y - 20, 70, 40)
        }
      }
      this.components.add(`irrigation:${method}`)
    })
  }

  private fertilizers(model: GardenVisualModel) {
    const placements = gardenFeaturePlacements(model.region, model.kind)
    if (placements) {
      // Whichever fertilizer was actually registered receives the most visible
      // side-of-garden position; unregistered materials do not occupy space.
      const regionalMaterials = model.characteristics.naturalFertilizers.filter(value => value !== 'fallow')
      const materialPositions = [
        placements.fertilizers.compost,
        placements.fertilizers.plantRemains,
        placements.fertilizers.leaves,
      ]
      model.characteristics.naturalFertilizers.forEach(fertilizer => {
        if (fertilizer === 'fallow') {
          const { x, y } = placements.fertilizers.fallow ?? { x: 0, y: 0 }
          const sign = this.graphics('structures', y * 10)
          sign.fillStyle(0x263a25, .2).fillRoundedRect(x - 90, y - 49, 180, 39, 8)
          sign.fillStyle(0x8a5d31).fillRoundedRect(x - 88, y - 53, 176, 39, 7)
          sign.fillStyle(0xf0e0b1).fillRoundedRect(x - 83, y - 48, 166, 29, 5)
          sign.lineStyle(1.5, 0xc59b55).strokeRoundedRect(x - 83, y - 48, 166, 29, 5)
          this.add('structures', this.scene.add.text(x, y - 34, 'Barbecho declarado', { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#4b5a36' }).setOrigin(.5), y * 10 + 1)
        } else {
          const point = model.region === 'costa'
            ? placements.fertilizers[fertilizer]
            : (materialPositions[regionalMaterials.indexOf(fertilizer)] ?? placements.fertilizers[fertilizer])
          if (point) {
            const frame = ({ leaves: 0, plantRemains: 1, compost: 2 } as const)[fertilizer]
            // The non-coastal service materials occupy a clear side lane,
            // rather than vanishing below the garden toolbar. Keep the
            // previously approved Costa sizes and locations unchanged.
            const regional = model.region !== 'costa'
            const width = regional
              ? fertilizer === 'compost' ? 234 : fertilizer === 'plantRemains' ? 210 : 204
              : model.kind === 'ground' ? 112 : 220
            if (regional && model.kind === 'ground') {
              const color = model.region === 'galapagos' ? 0x65584b : model.region === 'oriente' ? 0x4f6537 : 0x79653f
              const patch = this.graphics('ground', point.y)
              patch.fillStyle(0x17271a, .18).fillEllipse(point.x + 6, point.y + 14, width * .82, width * .21)
              patch.fillStyle(color, .26).fillEllipse(point.x, point.y + 9, width * .76, width * .16)
            } else this.regionalServiceBase(model, point.x, point.y, regional ? width * .83 : 148)
            if (!this.supply(frame, point.x, point.y, width, point.y * 10 + 1500, regional)) {
              const pile = this.graphics('structures', point.y * 10)
              pile.fillStyle(fertilizer === 'compost' ? 0x54402c : 0x9b8545).fillEllipse(point.x, point.y - 8, width * .62, width * .23)
            }
          }
        }
        this.components.add(`fertilizer:${fertilizer}`)
      })
      return
    }
    model.characteristics.naturalFertilizers.forEach((fertilizer, index) => {
      // Declaring a material does not declare a composter, shed or storage installation.
      if (fertilizer !== 'fallow') {
        const x = 280 + index % 2 * 140
        const y = 1240 + Math.floor(index / 2) * 115
        const frame = { leaves: 0, plantRemains: 1, compost: 2 }[fertilizer]
        if (!this.supply(frame, x, y, 175)) {
          const fallback = this.graphics('structures', y * 10)
          fallback.fillStyle(fertilizer === 'compost' ? 0x54402c : 0x9b8545).fillEllipse(x, y - 12, 95, 35)
        }
      }
      this.components.add(`fertilizer:${fertilizer}`)
    })
  }

  private groundSlot(model: GardenVisualModel, slot: VisualSlot) {
    const s = model.footprintScale
    if (model.region !== 'costa' && slot.design === null && this.scene.textures.exists('organic-soil')) {
      // Neutral, organic earth mound with no floating rectangular timber frame.
      // This is still an empty cultivable space, never a planted/cared-for state.
      const atlas = this.scene.textures.get('organic-soil').getSourceImage() as HTMLImageElement
      const ratio = Math.max(.72, Math.min(1.06, s / .982))
      const plot = this.painted('parcels', `natural-bed-${model.region}-${model.soilType}-${slot.plot}-v2`,
        512, 512, ctx => {
          ctx.drawImage(atlas, 0, 0, 512, 512, 0, 0, 512, 512)
          tintEarth(ctx, model)
        }, slot.anchor.x, slot.anchor.y, slot.depth * 10)
      plot?.setOrigin(.5).setPosition(slot.anchor.x, slot.anchor.y)
        .setDisplaySize(410 * ratio, 325 * ratio)
      this.components.add(`parcel:${model.region}-organic`)
      this.components.add(`soil:${model.soilType ?? 'unknown'}`)
      return
    }
    if (model.region === 'costa' || slot.design === null) {
      // Each selected distribution fully replaces the former coastal bed art.
      // The approved PNG sheets contain six independently cropped plot sprites.
      if (isCoastalRelief(slot.design)) {
        const design = slot.design
        const { width, height } = coastalReliefGeometry(slot.plot, design, s)
        const key = COASTAL_RELIEF_KEY[design]
        let drawn = false
        if (this.scene.textures.exists(key)) {
          const source = this.scene.textures.get(key).getSourceImage() as HTMLImageElement
          const frame = coastalReliefFrame(source, slot.plot)
          try {
            const texture = this.painted('parcels',
              `costa-distribution-reference-v1-${design}-${slot.plot}-${model.soilType ?? 'unknown'}`,
              Math.ceil(frame.width), Math.ceil(frame.height),
              ctx => {
                ctx.drawImage(source, frame.x, frame.y, frame.width, frame.height, 0, 0, ctx.canvas.width, ctx.canvas.height)
                tintEarth(ctx, model)
              },
              slot.anchor.x, slot.anchor.y, slot.depth * 10)
            if (texture) {
              const scale = Math.min(width / frame.width, height / frame.height)
              const displayWidth = frame.width * scale, displayHeight = frame.height * scale
              texture.setOrigin(.5).setPosition(slot.anchor.x, slot.anchor.y).setDisplaySize(displayWidth, displayHeight)
              drawn = true
            }
          } catch (error) {
            console.warn('[Kawsapacha] No se pudo colorear el relieve; conservando el PNG', error)
          }
          if (!drawn) {
            this.add('parcels', this.scene.add.image(slot.anchor.x, slot.anchor.y, key)
              .setOrigin(.5).setDisplaySize(width, height), slot.depth * 10)
            drawn = true
          }
        }
        // Fallback: original transparent atlas, not the coastal rectangular beds.
        if (!drawn && this.scene.textures.exists('organic-soil')) {
          const atlas = this.scene.textures.get('organic-soil').getSourceImage() as HTMLImageElement
          const relief = this.painted('parcels',
            `costa-relief-atlas-fallback-v3-${design}-${model.soilType ?? 'unknown'}`,
            512, 512,
            ctx => paintCoastalStandaloneRelief(ctx, atlas, model.soilType, model.soilStyle, design),
            slot.anchor.x - width / 2, slot.anchor.y - height / 2, slot.depth * 10)
          if (relief) { relief.setDisplaySize(width, height); drawn = true }
        }
        if (!drawn) {
          this.painted('parcels', `costa-relief-drawn-v3-${design}-${model.soilType ?? 'unknown'}`,
            440, 330, ctx => paintPlot(ctx, model, design, this.materials),
            slot.anchor.x - width / 2, slot.anchor.y - height / 2, slot.depth * 10)
            ?.setDisplaySize(width, height)
        }
        this.components.add(`parcel:costa-relief:${design}`)
        this.components.add(`design:${design}`)
        this.components.add(`soil:${model.soilType ?? 'unknown'}`)
        return
      }
      // Unspecified distribution: reuse the six original approved flat beds.
      const key = model.soilType === 'marsh' ? 'costa-plot-marsh' : `costa-plot-${slot.plot}`
      if (this.scene.textures.exists(key)) {
        const source = this.scene.textures.get(key).getSourceImage() as HTMLImageElement
        const width = (slot.plot < 3 ? 354 : 382) * s
        const height = width * source.height / source.width
        let composite: Phaser.GameObjects.Image | null = null
        try {
          composite = this.painted('parcels',
            `costa-original-bed-v4-${slot.plot}-${model.soilType ?? 'unknown'}`,
            source.width, source.height,
            ctx => paintCoastalOriginalBed(ctx, source, model.soilType, model.soilStyle),
            slot.anchor.x - width / 2, slot.anchor.y - height / 2, slot.depth * 10)
        } catch (error) {
          console.warn('[Kawsapacha] Error al tintar la cama; usando PNG original', error)
        }
        if (composite) composite.setDisplaySize(width, height)
        else this.add('parcels', this.scene.add.image(slot.anchor.x, slot.anchor.y, key)
          .setOrigin(.5).setDisplaySize(width, height), slot.depth * 10)
        this.components.add(`parcel:${model.region}-${model.soilType === 'marsh' ? 'marsh' : 'flat'}`)
      } else this.coastalFallback(model, slot, s)
      this.components.add(`soil:${model.soilType ?? 'unknown'}`)
      if (slot.design) this.components.add(`design:${slot.design}`)
      return
    }
    if (isCoastalRelief(slot.design)) {
      const design = slot.design
      const { width, height } = coastalReliefGeometry(slot.plot, design, s)
      const key = COASTAL_RELIEF_KEY[design]
      let drawn = false
      if (this.scene.textures.exists(key)) {
        const source = this.scene.textures.get(key).getSourceImage() as HTMLImageElement
        const frame = coastalReliefFrame(source, slot.plot)
        const texture = this.painted('parcels', `${model.region}-distribution-reference-v1-${design}-${slot.plot}-${model.soilType ?? 'unknown'}`,
          Math.ceil(frame.width), Math.ceil(frame.height), ctx => {
            ctx.drawImage(source, frame.x, frame.y, frame.width, frame.height, 0, 0, ctx.canvas.width, ctx.canvas.height)
            tintEarth(ctx, model)
          }, slot.anchor.x, slot.anchor.y, slot.depth * 10)
        if (texture) {
          const factor = Math.min(width / frame.width, height / frame.height)
          texture.setOrigin(.5).setPosition(slot.anchor.x, slot.anchor.y).setDisplaySize(frame.width * factor, frame.height * factor)
          drawn = true
        }
      }
      if (!drawn && this.scene.textures.exists('organic-soil')) {
        const atlas = this.scene.textures.get('organic-soil').getSourceImage() as HTMLImageElement
        const relief = this.painted('parcels', `${model.region}-relief-fallback-${design}-${slot.plot}-${model.soilType ?? 'unknown'}`,
          512, 512, ctx => paintCoastalStandaloneRelief(ctx, atlas, model.soilType, model.soilStyle, design),
          slot.anchor.x - width / 2, slot.anchor.y - height / 2, slot.depth * 10)
        if (relief) { relief.setDisplaySize(width, height); drawn = true }
      }
      if (!drawn) this.painted('parcels', `${model.region}-relief-drawn-${design}-${slot.plot}-${model.soilType ?? 'unknown'}`,
        440, 330, ctx => paintPlot(ctx, model, design, this.materials), slot.anchor.x - width / 2, slot.anchor.y - height / 2, slot.depth * 10)?.setDisplaySize(width, height)
      this.components.add(`parcel:${model.region}-relief:${design}`)
      this.components.add(`design:${design}`)
      this.components.add(`soil:${model.soilType ?? 'unknown'}`)
      return
    }
    if (slot.design === 'beds' && this.scene.textures.exists('empty-bed')) {
      const bedWidth = 335
      this.add('parcels', this.scene.add.image(slot.anchor.x, slot.anchor.y, 'empty-bed').setOrigin(.5, .46).setScale(bedWidth * s / 1536), slot.depth * 10)
    } else if (this.scene.textures.exists('organic-soil')) {
      const frame = slot.design ? { furrows: 1, beds: 2, raisedBeds: 3, terraces: 4 }[slot.design] : 0
      const source = this.scene.textures.get('organic-soil').getSourceImage() as HTMLImageElement
      this.painted('parcels', `relief-${slot.design}-${model.soilType}`, 512, 512, ctx => {
        ctx.drawImage(source, frame % 3 * 512, Math.floor(frame / 3) * 512, 512, 512, 0, 0, 512, 512)
        tintEarth(ctx, model)
      }, slot.anchor.x - 256 * s * .72, slot.anchor.y - 256 * s * .72, slot.depth * 10)?.setScale(s * .72)
    } else this.painted('parcels', `plot-${slot.design}-${model.soilType}-${model.region === 'galapagos'}`, 440, 330, ctx => paintPlot(ctx, model, slot.design, this.materials), slot.anchor.x - 220 * s, slot.anchor.y - 150 * s, slot.depth * 10)?.setScale(s)
    if (slot.design) this.components.add('design:' + slot.design)
  }

  private coastalFallback(model: GardenVisualModel, slot: VisualSlot, scale: number) {
    let fallback: Phaser.GameObjects.Image | null = null
    if (this.scene.textures.exists('organic-soil')) {
      const frame = slot.design ? { furrows: 1, beds: 2, raisedBeds: 3, terraces: 4 }[slot.design] : 0
      const source = this.scene.textures.get('organic-soil').getSourceImage() as HTMLImageElement
      fallback = this.painted('parcels', `costa-fallback-${slot.design}-${model.soilType}`, 512, 512, ctx => {
        ctx.drawImage(source, frame % 3 * 512, Math.floor(frame / 3) * 512, 512, 512, 0, 0, 512, 512)
        tintEarth(ctx, model)
      }, slot.anchor.x - 155 * scale, slot.anchor.y - 60 * scale, slot.depth * 10)?.setScale(scale * .6) ?? null
    } else {
      fallback = this.painted('parcels', `costa-procedural-${slot.plot}-${slot.design}-${model.soilType}`, 440, 330,
        ctx => paintPlot(ctx, model, slot.design, this.materials),
        slot.anchor.x - 220 * scale, slot.anchor.y - 165 * scale, slot.depth * 10)?.setScale(scale) ?? null
    }
    if (!fallback) {
      const patch = this.graphics('parcels', slot.depth * 10)
      patch.fillStyle(model.soilStyle.earth, .96).fillEllipse(slot.anchor.x, slot.anchor.y, 310 * scale, 118 * scale)
      patch.lineStyle(4, model.soilStyle.light, .85).strokeEllipse(slot.anchor.x, slot.anchor.y, 310 * scale, 118 * scale)
      this.components.add(`parcel:costa:graphics-fallback:${slot.plot}`)
    }
  }

  private potPlatform(model: GardenVisualModel, slot: VisualSlot) {
    const { x, y } = slot.base
    const palette = {
      sierra: { stone: 0xa8a18a, rim: 0x605a4d, light: 0xdcd0ae },
      costa: { stone: 0xc5a77a, rim: 0x8a6847, light: 0xf2d59f },
      oriente: { stone: 0x786b4f, rim: 0x3f4d32, light: 0xb9b08a },
      galapagos: { stone: 0x8b8b81, rim: 0x4a4a48, light: 0xc4bca8 },
    }[model.region]
    const padKey = `regional-pad-${model.region}`
    if (this.scene.textures.exists(padKey)) {
      this.add('ground', this.scene.add.image(x, y + 5, padKey).setOrigin(.5, .58)
        .setDisplaySize(330, 122), y)
      return
    }
    const g = this.graphics('ground', y)
    // A low elliptical flagstone ring physically seats each container in its yard.
    g.fillStyle(0x17261b, .21).fillEllipse(x + 9, y + 22, 275, 64)
    g.fillStyle(palette.rim, .97).fillEllipse(x, y + 12, 280, 79)
    g.fillStyle(palette.stone, .99).fillEllipse(x, y + 5, 271, 66)
    g.lineStyle(4, palette.light, .82).strokeEllipse(x, y + 1, 264, 59)
    for (let index = 0; index < 9; index++) {
      const a = index * Math.PI * 2 / 9
      const sx = x + Math.cos(a) * 113
      const sy = y + 4 + Math.sin(a) * 24
      g.lineStyle(2, palette.rim, .55).lineBetween(sx, sy - 7, sx + Math.cos(a) * 13, sy + 7)
    }
  }

  private container(model: GardenVisualModel, slot: VisualSlot) {
    const { x, y } = slot.anchor
    const s = model.footprintScale
    if (model.kind === 'vertical') {
      const texture = `regional-trough-${model.region}`
      // The soil opening is the interactive anchor. Three shelves per bay are
      // attached to the same shared structural frame, not floating meshes.
      if (this.scene.textures.exists(texture)) {
        const troughWidth = 355 * s
        this.add('parcels', this.scene.add.image(x, y, texture)
          .setOrigin(.5, 69 / 240).setDisplaySize(troughWidth, troughWidth * 240 / 512), slot.depth * 10)
        this.components.add(`container:trough:${model.region}`)
      } else if (this.scene.textures.exists('empty-trough')) {
        this.add('parcels', this.scene.add.image(x, y, 'empty-trough', 'tray')
          .setOrigin(.5, .25).setDisplaySize(310 * s, 142 * s), slot.depth * 10)
      } else this.graphics('parcels', slot.depth * 10).fillStyle(0x9a6b37).fillRoundedRect(x - 155, y - 18, 310, 104, 9)
      return
    }

    const hanging = model.kind === 'hanging'
    const geometry = hanging ? hangingGeometry(slot.plot, model.region) : null
    const width = (hanging ? geometry!.width : slot.plot < 3 ? 278 : 294) * s
    if (!hanging) this.potPlatform(model, slot)
    else {
      const shadow = this.graphics('ground', slot.base.y)
      shadow.fillStyle(0x19301d, .10).fillEllipse(x + 10, slot.base.y + 4, 190, 32)
      // Each basket has its own two suspension strands from a real shared beam.
      const ropes = this.graphics('structures', slot.depth * 10 - 3)
      const hookY = geometry!.hookY
      const braid = model.region === 'galapagos' ? 0xccc09d : model.region === 'sierra' ? 0xc49b61 : 0xe0c386
      for (const endX of [x - width * .31, x + width * .31]) {
        ropes.lineStyle(7, 0x6b5435, .95).lineBetween(x, hookY + 9, endX, y + 12)
        ropes.lineStyle(3, braid, .9).lineBetween(x - 1, hookY + 9, endX - 1, y + 12)
      }
      ropes.lineStyle(5, 0x60533b).strokeEllipse(x, hookY + 8, 13, 19)
    }

    const newKey = hanging ? `regional-baskets-${model.region}` : `regional-pots-${model.region}`
    if (this.scene.textures.exists(newKey)) {
      const mouth = 173
      const frame = `item-${slot.plot}`
      this.add('parcels', this.scene.add.image(x, y, newKey, frame)
        .setOrigin(.5, mouth / 512).setDisplaySize(width, width), slot.depth * 10)
      this.components.add(`container:${hanging ? 'basket' : 'pot'}:${model.region}`)
    } else if (this.scene.textures.exists('empty-pots')) {
      const variant = hanging ? 1 : potArtwork(model.region, slot.plot).variant
      this.add('parcels', this.scene.add.image(x, y, 'empty-pots', `pot-${variant}`)
        .setOrigin(.5, POT_GEOMETRY[variant].mouth / 512).setDisplaySize(width, width), slot.depth * 10)
    } else this.graphics('parcels', slot.depth * 10).fillStyle(0xb57b45).fillEllipse(x, y + 50, width, 130)
  }

  private slot(model: GardenVisualModel, slot: VisualSlot) {
    if (model.kind === 'ground') this.groundSlot(model, slot)
    else this.container(model, slot)
    const { x, y } = slot.anchor
    if (slot.lastPreparedAt) {
      const prepared = this.graphics('parcels', slot.depth * 10 + .1)
      for (let grain = 0; grain < 24; grain++) prepared.fillStyle(grain % 2 ? model.soilStyle.light : model.soilStyle.grain, .55).fillEllipse(x - 100 + grain % 8 * 28, y - 35 + Math.floor(grain / 8) * 26, 6, 3)
      this.components.add('activity:prepared')
    }
    if (slot.lastFertilizedAt) {
      const badge = this.graphics('plants', slot.depth * 10 + 4)
      badge.fillStyle(0xb6984e, .9).fillCircle(x + 38, y + 25, 7)
      badge.lineStyle(2, 0xffe3a0).strokeCircle(x + 38, y + 25, 7)
      this.components.add('activity:fertilized')
    }
    if (!slot.plant) {
      // A tiny warm glint suggests interactivity without a sign, number or fake crop.
      const g = this.graphics('plants', slot.depth * 10 + 1)
      g.fillStyle(0xffeab1, .12).fillEllipse(x, y, 46, 26)
      g.lineStyle(2, 0xffe9b1, .75).strokeEllipse(x, y, 18, 10)
      g.fillStyle(0xfff4d2, .9).fillCircle(x, y - 1, 3)
    } else {
      // Espejo Digital V2: la fotografía solo es evidencia en Pasaporte Vivo.
      // Sin observación explícita, se dibuja una señal sin crecimiento inventado.
      const stage = documentedGrowthStage(slot.plant)
      const illustration = this.graphics('plants', slot.depth * 10 + 2).setPosition(x, y)
      paintObservedPlant(illustration, stage, slot.plant.name, slot.plant.latin)
      this.components.add('plant-stage:' + (stage ?? 'unrecorded'))

    }
    this.components.add('slot:' + slot.id)
  }

  selection(model: GardenVisualModel, selected: SlotId | null, hovered: SlotId | null) {
    this.clear('effects')
    for (const slot of model.slots) {
      if (slot.id !== selected && slot.id !== hovered) continue
      const { x, y } = slot.anchor
      const g = this.graphics('effects')
      const coastalGround = model.region === 'costa' && model.kind === 'ground'
      const coastalRelief = coastalGround && isCoastalRelief(slot.design)
        ? coastalReliefGeometry(slot.plot, slot.design, model.footprintScale) : null
      const regionalRelief = model.kind === 'ground' && !coastalGround && isCoastalRelief(slot.design)
        ? coastalReliefGeometry(slot.plot, slot.design, model.footprintScale) : null
      const width = model.kind === 'ground' ? (coastalRelief || regionalRelief ? (coastalRelief ?? regionalRelief)!.width * .87 : coastalGround ? (slot.plot < 3 ? 340 : 368) : 295) : model.kind === 'vertical' ? 300 : model.kind === 'pots' ? 210 : 190
      const height = model.kind === 'ground' ? (coastalRelief || regionalRelief ? (coastalRelief ?? regionalRelief)!.height * .88 : coastalGround ? (slot.plot < 3 ? 132 : 145) : 185) : model.kind === 'vertical' ? 83 : model.kind === 'pots' ? 75 : 75
      g.fillStyle(0xffe7a0, .08).fillEllipse(x, y, width, height)
      g.lineStyle(15, 0xffe5a0, .12).strokeEllipse(x, y, width + 12, height + 12)
      g.lineStyle(3, 0xfff2b0, .95).strokeEllipse(x, y, width, height)
    }
  }

  /** Feedback is transient and cannot create or validate an agricultural record. */
  feedback(model: GardenVisualModel, type: ActivityType, plot: number | null, reducedMotion: boolean) {
    this.clear('feedback')
    for (const slot of model.slots.filter(item => plot === null || item.plot === plot)) {
      const point = slot.anchor
      const count = type === 'watering' && !reducedMotion ? 9 : 1
      for (let index = 0; index < count; index++) {
        const node = this.graphics('feedback', 5).setPosition(point.x + (index % 3 - 1) * 22, point.y - (type === 'watering' ? 65 : 0))
        const color = type === 'watering' ? 0x80d9eb : type === 'fertilizing' ? 0xe5c671 : 0xf5df9e
        if (type === 'watering' && !reducedMotion) node.fillStyle(color, .9).fillCircle(0, 0, 5).fillTriangle(-4, 0, 4, 0, 0, -9)
        else node.lineStyle(3, color, .9).strokeEllipse(0, 0, 140, 65)
        const destroy = () => { this.nodes.feedback.delete(node); node.destroy() }
        if (reducedMotion) this.scene.time.delayedCall(750, destroy)
        else this.scene.tweens.add({ targets: node, y: point.y + 20, alpha: 0, duration: type === 'watering' ? 650 : 1000, delay: index * 65, onComplete: destroy })
      }
    }
  }
}
