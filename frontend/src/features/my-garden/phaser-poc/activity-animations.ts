import type Phaser from 'phaser'
import type { ActivityType } from '../journal/activities'
import type { GardenVisualModel } from './model'
import { feedbackMotion, hasIllustratedFeedback, paintActivityFeedback, paintSecondaryFeedback } from './activity-feedback-art'
import { WORLD } from './assets'

export type EffectNode = Phaser.GameObjects.Image | Phaser.GameObjects.Graphics
type EffectContext = {
  scene: Phaser.Scene
  graphics: (depth: number) => Phaser.GameObjects.Graphics
  image: (key: string, x: number, y: number, depth: number) => Phaser.GameObjects.Image
  live: (node: EffectNode) => boolean
  destroy: (node: EffectNode) => void
}
export const TOOL_ANIMATION_MS = 2200

/**
 * Cada overlay se dibuja sobre el espacio REAL de Phaser.
 * Solo incluye implementos, agua, compost y gestos: jamás crea plantas.
 */
export function playActivityAnimation(
  ctx: EffectContext, model: GardenVisualModel, type: ActivityType, plot: number | null, reducedMotion: boolean,
) {
  const { scene, graphics, image, live, destroy } = ctx
  const targets = plot === null
    ? [{ x: WORLD.centerX, y: WORLD.centerY }]
    : model.slots.filter(slot => slot.plot === plot).map(slot => slot.anchor)
  const scale = model.kind === 'ground' ? 1 : model.kind === 'pots' ? .74 : .57

  const fade = (node: EffectNode, after: number, duration = 350) => {
    scene.time.delayedCall(after, () => {
      if (!live(node)) return
      if (reducedMotion) { destroy(node); return }
      scene.tweens.add({ targets: node, alpha: 0, duration, ease: 'Sine.easeIn', onComplete: () => destroy(node) })
    })
  }

  for (const { x, y } of targets) {
    const illustrated = hasIllustratedFeedback(type)
    const tone = type === 'watering' ? 0x2f281e : type === 'fertilizing' ? 0x614224 : 0x966c43
    if (type === 'watering' || type === 'fertilizing' || type === 'preparation' || type === 'hilling') {
      const soil = graphics(1).setPosition(x, y - 4).setAlpha(0)
      const width = (type === 'watering' ? 120 : 108) * scale
      const height = 34 * scale
      soil.fillStyle(tone, .69).fillEllipse(0, 0, width, height)
      if (type === 'watering') {
        soil.lineStyle(2.2, 0xa4dfe9, .8).strokeEllipse(0, 0, width * .76, height * .7)
        soil.lineStyle(1.4, 0xc3f1f6, .7).strokeEllipse(0, 0, width * .43, height * .34)
      } else if (type === 'fertilizing') {
        for (let i = 0; i < 12; i++) soil.fillStyle(i % 2 ? 0xc9ae69 : 0x936239, .92)
          .fillEllipse((i * 19 % 95 - 47) * scale, (i * 11 % 25 - 12) * scale, 6 * scale, 4 * scale)
      } else {
        soil.lineStyle(2.1, 0xe2bd82, .8).strokeEllipse(0, 0, width * .7, height * .55)
      }
      if (reducedMotion) soil.setAlpha(.65)
      else scene.tweens.add({ targets: soil, alpha: .66, scaleX: 1.05, scaleY: 1.05, delay: 250, duration: 420 })
      fade(soil, 1620, 510)
    }

    if (illustrated) {
      const key = 'activity-tool-' + type
      if (scene.textures.exists(key)) {
        const right = type === 'watering' ? 107 : type === 'weeding' ? 94 : 92
        const top = type === 'harvest' ? -79 : -121
        const dimension = (type === 'weeding' ? 150 : 168) * scale
        const tool = image(key, x + (right + 18) * scale, y + (top - 20) * scale, 3)
          .setDisplaySize(dimension, dimension * 220 / 240)
          .setAlpha(reducedMotion ? 1 : 0)
        if (reducedMotion) tool.setPosition(x + right * scale, y + top * scale)
        else scene.tweens.add({
          targets: tool,
          x: x + right * scale, y: y + top * scale,
          angle: type === 'watering' ? -15 : type === 'fertilizing' ? -13 : type === 'weeding' ? -22 : -7,
          alpha: 1,
          duration: 340, ease: 'Sine.easeOut',
          yoyo: type === 'weeding', hold: type === 'weeding' ? 90 : 0,
        })
        fade(tool, 1420, 420)
      }
    }

    if (type === 'watering') {
      // Flujo real de la regadera al suelo, sin alterar la etapa botánica.
      const stream = graphics(2).setPosition(x, y).setAlpha(0)
      for (let i = 0; i < 5; i++) {
        const shift = (i - 2) * 6
        stream.lineStyle(2.8 * scale, i % 2 ? 0x9de6f3 : 0x48bde4, .94)
          .lineBetween((42 + shift) * scale, -89 * scale, (13 + shift) * scale, -11 * scale)
        stream.fillStyle(0xe3f8fc, .95)
          .fillEllipse((13 + shift) * scale, -9 * scale, 5 * scale, 7 * scale)
      }
      if (reducedMotion) stream.setAlpha(1)
      else scene.tweens.add({ targets: stream, alpha: 1, delay: 330, duration: 160, yoyo: true, hold: 690 })
      fade(stream, 1350, 200)
    }

    // Partículas y gestos. Las otras 9 actividades tienen cada una señal
    // propia, sin añadir cultivos falsos al huerto ni cambiar los registros.
    const total = illustrated ? (reducedMotion ? 1 : feedbackMotion(type, 0).count) : 1
    for (let index = 0; index < total; index++) {
      const motion = illustrated
        ? feedbackMotion(type, index)
        : { fromY: -23, toY: -37, duration: 790, delay: 40 }
      const delta = index - (total - 1) / 2
      const spread = illustrated && type === 'watering' ? 13
        : illustrated && type === 'fertilizing' ? 17
        : illustrated && type === 'weeding' ? 20 : 9
      const particle = graphics(4)
        .setPosition(x + delta * spread * scale, y + (reducedMotion ? -22 : motion.fromY) * scale)
        .setScale(scale * (illustrated ? .9 : 1.1))
      if (illustrated) paintActivityFeedback(particle, type, index)
      else paintSecondaryFeedback(particle, type)
      if (reducedMotion) scene.time.delayedCall(1150, () => { if (live(particle)) destroy(particle) })
      else scene.tweens.add({
        targets: particle, y: y + motion.toY * scale, alpha: 0,
        duration: motion.duration,
        delay: motion.delay + (type === 'watering' || type === 'fertilizing' ? 280 : 0),
        ease: type === 'weeding' || type === 'harvest' ? 'Sine.easeOut' : 'Sine.easeIn',
        onComplete: () => destroy(particle),
      })
    }
  }
}
