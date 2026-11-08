import Phaser from 'phaser'
import { potArtwork } from '../pot-artwork'
import { PROP_FRAMES, SCENE_LAYERS, photoTextureKey, WORLD } from './assets'
import { REGION_STYLES } from './visual-config'
import { makeMaterials, paintFence, paintMeadow, paintPlot, paintStone, paintSupport, tintEarth, type Materials } from './paint-materials'
import type { GardenVisualModel, SlotId, VisualSlot } from './model'
import { POT_GEOMETRY, VERTICAL_GROUPS, HANGING_GROUPS, COASTAL_HANGING_GROUPS, hangingGeometry } from './layouts'
import { paintCourtyard } from './courtyard'
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
    if (!this.horizon) return
    const origin = camera.getWorldPoint(0, 0)
    const width = camera.width / camera.zoom
    const height = camera.height / camera.zoom
    // Cover the viewport while preserving the source artwork's aspect ratio.
    // The landscape stays behind the terrain and moves gently with the camera.
    const image = this.horizon.texture.getSourceImage() as HTMLImageElement
    const scale = Math.max(width * 1.12 / image.width, height * 1.08 / image.height)
    const displayWidth = image.width * scale
    const displayHeight = image.height * scale
    // Costa uses more of the source seascape: the previous viewport-covering
    // placement hid almost all of the ocean behind the lawn.
    const horizonTop = this.isCoast ? origin.y - height * .22 : origin.y - height * .025
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
    this.environment(model)
    this.lastRenderStage = `floor:${model.region}`
    this.floor(model)
    for (const slot of model.slots) {
      this.lastRenderStage = `slot:${slot.id}`
      this.slot(model, slot)
    }
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
    if (model.region === 'costa') {
      // No generic adobe house in Costa: the atlas house is Andean in style.
      // Coastal houses remain visible in the regional landscape itself. A
      // dedicated coastal sprite can be added later without changing the garden.
      if (this.scene.textures.exists('regional-borders')) {
        for (const [x, y, width, flip] of [[90, 1120, 300, 0], [1825, 1080, 315, 1]] as const) {
          this.add('structures', this.scene.add.image(x, y, 'regional-borders', 'border-1').setOrigin(.5, .9).setDisplaySize(width, width * 2 / 3).setFlipX(Boolean(flip)), y * 10)
        }
      }
      return
    }
    if (!this.scene.textures.exists('regional-borders')) return
    const frame = 'border-' + { sierra: 0, costa: 1, oriente: 2, galapagos: 3 }[model.region]
    for (const [x, y, width, flip] of [[105, 1440, 435, 0], [1790, 1450, 475, 1], [100, 1060, 290, 0], [1800, 1010, 270, 1]]) {
      this.add('structures', this.scene.add.image(x, y, 'regional-borders', frame).setOrigin(.5, .9).setDisplaySize(width, width * 2 / 3).setFlipX(Boolean(flip)), y * 10)
    }
  }

  private floor(model: GardenVisualModel) {
    // This key is versioned for the corrected opaque coastal lawn, but cache
    // versioning is not the fix: paintCoastalGround now restores alpha itself.
    const floorKey = model.region === 'costa' ? 'courtyard-costa-integrated-v6' : 'courtyard-' + model.region
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
    const locations: [number, number][] = []
    for (let index = 0; index < 6; index++) locations.push([495 + index * 200, 798 - index * 23])
    // An open entrance aligns with the access path. Rails meet at shared posts.
    for (const x of [415, 615, 1130, 1330, 1530]) locations.push([x, 1435 - (x - 415) * .115])
    locations.forEach(([x, y], index) => {
      const kind = kinds[index % kinds.length]
      if (kind === 'natural' && this.scene.textures.exists('modular-props')) {
        this.prop('fence', x + 100, y, 248, undefined, y < 800 ? 4000 : y * 10)?.setFlipX(true)
      } else if (kind !== 'natural' && this.scene.textures.exists('garden-infrastructure')) {
        const frame = { living: 0, recycled: 1, metal: 2, conventional: 3 }[kind]
        this.add('structures', this.scene.add.image(x + 100, y, 'garden-infrastructure', 'item-' + frame).setOrigin(.5, .86).setDisplaySize(240, 240), y < 800 ? 4000 : y * 10)
      } else this.painted('structures', `fence-${kind}-${index % 3}`, 255, 190, ctx => paintFence(ctx, kind, index % 3), x - 15, y - 155, y < 800 ? 4000 : y * 10)
      this.components.add(`fence:${kind}`)
    })
  }

  private coastalFences(model: GardenVisualModel, kinds: GardenVisualModel['characteristics']['fences']) {
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
  }

  private water(model: GardenVisualModel) {
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

  private supply(frame: number, x: number, y: number, width: number) {
    if (!this.scene.textures.exists('garden-supplies')) return false
    this.add('structures', this.scene.add.image(x, y, 'garden-supplies', 'item-' + frame).setOrigin(.5, frame < 3 ? .76 : .86).setDisplaySize(width, width), y * 10)
    return true
  }

  private irrigation(model: GardenVisualModel) {
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
    if (model.region === 'costa') {
      const key = model.soilType === 'marsh' ? 'costa-plot-marsh' : `costa-plot-${slot.plot}`
      if (this.scene.textures.exists(key)) {
        const source = this.scene.textures.get(key).getSourceImage() as HTMLImageElement
        // Mild perspective: the front row is visibly larger while preserving
        // its actual hit target and the stored garden-slot identifiers.
        const width = (slot.plot < 3 ? 354 : 382) * s
        const height = width * source.height / source.width
        this.add('parcels', this.scene.add.image(slot.anchor.x, slot.anchor.y, key).setOrigin(.5).setDisplaySize(width, height), slot.depth * 10)
        this.coastalDesign(model, slot, width, height)
        this.components.add(`parcel:costa-${model.soilType === 'marsh' ? 'marsh' : 'flat'}`)
      } else {
        // Keep the existing soil designs visible if a new coastal texture fails to load.
        this.coastalFallback(model, slot, s)
      }
      if (slot.design) this.components.add('design:' + slot.design)
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

  /** Recorded earth layouts remain legible over the new coastal bed art. */
  private coastalDesign(model: GardenVisualModel, slot: VisualSlot, width: number, height: number) {
    if (!slot.design) return
    const { x, y } = slot.anchor
    const g = this.graphics('parcels', slot.depth * 10 + .5)
    const left = x - width * .34, right = x + width * .34
    const offsets = slot.design === 'terraces' ? [-.22, .18] : [-.2, 0, .2]
    const tone = model.soilType === 'marsh' ? 0x786c51 : model.soilStyle.earth
    offsets.forEach((offset, index) => {
      const rowY = y + height * offset
      if (slot.design === 'furrows') {
        g.lineStyle(5, 0x402b1b, .48).lineBetween(left, rowY + 3, right, rowY - 3)
        g.lineStyle(2, 0xe1b77a, .42).lineBetween(left, rowY - 1, right, rowY - 7)
      } else if (slot.design === 'terraces') {
        g.lineStyle(8, 0x72583a, .8).lineBetween(left, rowY + 5, right, rowY - 5)
        g.lineStyle(2, 0xd5b581, .8).lineBetween(left, rowY, right, rowY - 10)
      } else if (slot.design === 'raisedBeds') {
        g.fillStyle(tone, .2).fillEllipse(x, rowY, width * .62, height * .18)
        g.lineStyle(2, 0xe7c18b, .48).strokeEllipse(x, rowY - 2, width * .62, height * .15)
      }
      this.components.add(`coastal-layout:${slot.design}:${index}`)
    })
  }

  private container(model: GardenVisualModel, slot: VisualSlot) {
    const { x, y } = slot.anchor
    const s = model.footprintScale
    const hanging = model.kind === 'hanging'
    if (model.kind === 'vertical') {
      // Mounting brackets touch the actual slats; opening and focus share an anchor.
      const brackets = this.graphics('structures', slot.depth * 10 - 2)
      brackets.lineStyle(7, 0x524e35).lineBetween(x - 100 * s, y + 35, x - 100 * s, y + 86).lineBetween(x + 100 * s, y + 35, x + 100 * s, y + 86)
      if (this.scene.textures.exists('empty-trough')) this.add('parcels', this.scene.add.image(x, y, 'empty-trough', 'tray').setOrigin(.5, .25).setDisplaySize(240 * s, 102 * s).setRotation(-.115), slot.depth * 10)
      else this.graphics('parcels', slot.depth * 10).fillStyle(0x9a6b37).fillRoundedRect(x - 130, y - 20, 260, 95, 9)
    } else {
      const variant = hanging ? 1 : potArtwork(model.region, slot.plot).variant
      const width = (hanging ? hangingGeometry(slot.plot, model.region).width : slot.plot < 3 ? 213 : 245) * s
      this.painted('ground', 'soft-contact', 512, 128, ctx => {
        ctx.scale(1, .25)
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 250)
        gradient.addColorStop(0, '#182f2390'); gradient.addColorStop(.4, '#182f2340'); gradient.addColorStop(1, '#182f2300')
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 512)
      }, x - width * .45 + 4, slot.base.y - width * .1, slot.base.y)?.setDisplaySize(width * .9, width * .225).setAlpha(hanging ? .4 : 1)
      if (hanging) {
        const ropes = this.graphics('structures', slot.depth * 10 - 2)
        // Both rows hang from load-bearing crossbeams, with matched endpoints.
        const hookY = hangingGeometry(slot.plot, model.region).hookY
        for (const endX of [x - width * .37, x + width * .37]) {
          ropes.lineStyle(5, 0x73582d).lineBetween(x, hookY + 8, endX, y + 9)
          ropes.lineStyle(2, 0xe9cf8a).lineBetween(x - 1, hookY + 8, endX - 1, y + 9)
        }
        ropes.lineStyle(4, 0x524b32).strokeEllipse(x, hookY + 8, 13, 19)
      }
      if (this.scene.textures.exists('empty-pots')) this.add('parcels', this.scene.add.image(x, y, 'empty-pots', `pot-${variant}`).setOrigin(.5, POT_GEOMETRY[variant].mouth / 512).setDisplaySize(width, width), slot.depth * 10)
      else this.graphics('parcels', slot.depth * 10).fillStyle(0xb57b45).fillEllipse(x, y + 50, width, 130)
    }
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
      const key = photoTextureKey(slot.plant.id, slot.plant.photo)
      const g = this.graphics('plants', slot.depth * 10 + 1)
      g.fillStyle(0x263e28, .25).fillEllipse(x + 4, y + 28, 82, 23)
      g.fillStyle(0x254632).fillCircle(x, y - 13, 43)
      g.lineStyle(3, 0xf5dca0).strokeCircle(x, y - 13, 43)
      if (this.scene.textures.exists(key)) {
        const frame = this.scene.textures.getFrame(key)
        const image = this.add('plants', this.scene.add.image(x, y - 13, key).setScale(76 / Math.min(frame.realWidth, frame.realHeight)), slot.depth * 10 + 2)
        const shape = this.scene.make.graphics({ x: 0, y: 0 }, false)
        shape.fillStyle(0xffffff).fillCircle(x, y - 13, 38)
        this.nodes.plants.add(shape)
        const mask = shape.createGeometryMask()
        image.setMask(mask)
        this.masks.add(mask)
      }
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
      const width = model.kind === 'ground' ? (coastalGround ? (slot.plot < 3 ? 340 : 368) : 295) : 250
      const height = model.kind === 'ground' ? (coastalGround ? (slot.plot < 3 ? 132 : 145) : 185) : 108
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
